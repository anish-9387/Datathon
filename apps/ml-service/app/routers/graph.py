import logging
from typing import Optional

import networkx as nx
import numpy as np
from fastapi import APIRouter, HTTPException, Query

from app.models import CrimeDNAEncoderInstance
from app.schemas import (
    FIRInput,
    CriminalNetworkRequest,
    CriminalNetworkResponse,
    NetworkNode,
    NetworkEdge,
    GangDetectionResponse,
    InfluenceResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter()

encoder_instance = CrimeDNAEncoderInstance()


def _build_graph(fir_dicts: list[dict]) -> nx.Graph:
    G = nx.Graph()

    for fir in fir_dicts:
        fir_id = fir.get("fir_id", "")
        if not fir_id:
            continue

        accused_names = str(fir.get("accused_name", "")).strip()
        victim_names = str(fir.get("victim_name", "")).strip()
        location = str(fir.get("location", "")).strip()
        weapon = str(fir.get("weapon", "")).strip()
        crime_type = str(fir.get("crime_type", "")).strip()
        district = str(fir.get("district", "")).strip()
        escape_mode = str(fir.get("escape_mode", "")).strip()

        G.add_node(fir_id, label=fir_id[:16] + "...", type="case")

        if accused_names:
            for name in [n.strip() for n in accused_names.replace("/", ",").split(",") if n.strip()]:
                node_id = f"accused_{name}"
                if not G.has_node(node_id):
                    G.add_node(node_id, label=name, type="person")
                G.add_edge(fir_id, node_id, weight=1.0, relationship="accused_in")

        if victim_names:
            for name in [n.strip() for n in victim_names.replace("/", ",").split(",") if n.strip()]:
                node_id = f"victim_{name}"
                if not G.has_node(node_id):
                    G.add_node(node_id, label=name, type="person")
                G.add_edge(fir_id, node_id, weight=1.0, relationship="victim_in")

        if location:
            loc_id = f"loc_{location.replace(' ', '_').lower()[:32]}"
            if not G.has_node(loc_id):
                G.add_node(loc_id, label=location[:24], type="location")
            G.add_edge(fir_id, loc_id, weight=0.8, relationship="occurred_at")

        if weapon and weapon != "Unknown":
            wp_id = f"weapon_{weapon.replace(' ', '_').lower()[:24]}"
            if not G.has_node(wp_id):
                G.add_node(wp_id, label=weapon, type="weapon")
            G.add_edge(fir_id, wp_id, weight=0.5, relationship="used_weapon")

        if district:
            dist_id = f"dist_{district.replace(' ', '_').lower()}"
            if not G.has_node(dist_id):
                G.add_node(dist_id, label=district, type="district")
            G.add_edge(fir_id, dist_id, weight=0.3, relationship="filed_in")

        if crime_type:
            ct_id = f"crime_{crime_type.replace(' ', '_').lower()}"
            if not G.has_node(ct_id):
                G.add_node(ct_id, label=crime_type, type="crime_type")
            G.add_edge(fir_id, ct_id, weight=0.5, relationship="type_of")

    nodes_by_location: dict[str, list[str]] = {}
    nodes_by_crime_type: dict[str, list[str]] = {}
    nodes_by_weapon: dict[str, list[str]] = {}

    for fir in fir_dicts:
        fir_id = fir.get("fir_id", "")
        loc = fir.get("location", "")
        ct = fir.get("crime_type", "")
        wp = fir.get("weapon", "")

        if loc:
            nodes_by_location.setdefault(loc, []).append(fir_id)
        if ct:
            nodes_by_crime_type.setdefault(ct, []).append(fir_id)
        if wp and wp != "Unknown":
            nodes_by_weapon.setdefault(wp, []).append(fir_id)

    for group in [nodes_by_location, nodes_by_crime_type, nodes_by_weapon]:
        for key, fids in group.items():
            for i in range(len(fids)):
                for j in range(i + 1, len(fids)):
                    if G.has_edge(fids[i], fids[j]):
                        G[fids[i]][fids[j]]["weight"] += 0.5
                    else:
                        G.add_edge(fids[i], fids[j], weight=0.5, relationship="same_attribute")

    return G


@router.post("/criminal-network", response_model=CriminalNetworkResponse)
async def build_criminal_network(request: CriminalNetworkRequest, firs: list[FIRInput]):
    try:
        fir_dicts = [f.model_dump() for f in firs]

        if not fir_dicts:
            raise HTTPException(status_code=400, detail="No FIRs provided")

        G = _build_graph(fir_dicts)

        nodes = []
        for node_id, data in G.nodes(data=True):
            degree = G.degree(node_id)
            nodes.append(NetworkNode(
                id=node_id,
                label=data.get("label", node_id),
                type=data.get("type", "unknown"),
                weight=float(degree),
            ))

        edges = []
        for u, v, data in G.edges(data=True):
            edges.append(NetworkEdge(
                source=u,
                target=v,
                weight=float(data.get("weight", 1.0)),
                relationship=data.get("relationship", "connected"),
            ))

        stats = {
            "total_nodes": G.number_of_nodes(),
            "total_edges": G.number_of_edges(),
            "density": round(nx.density(G), 4),
            "connected_components": nx.number_connected_components(G),
        }

        if G.number_of_nodes() > 0:
            stats["avg_degree"] = round(sum(dict(G.degree()).values()) / G.number_of_nodes(), 2)

        return CriminalNetworkResponse(
            nodes=nodes,
            edges=edges,
            stats=stats,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to build criminal network: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/gang-detection", response_model=GangDetectionResponse)
async def detect_gangs(request: CriminalNetworkRequest, firs: list[FIRInput]):
    try:
        fir_dicts = [f.model_dump() for f in firs]

        if not fir_dicts:
            raise HTTPException(status_code=400, detail="No FIRs provided")

        G = _build_graph(fir_dicts)

        if G.number_of_nodes() < 3:
            return GangDetectionResponse(
                communities=[],
                total_gangs=0,
                modularity_score=0.0,
            )

        # Project the bipartite person-case graph onto persons: two persons are
        # linked if they are co-accused in one FIR (strong), or appear in FIRs
        # sharing a location or weapon (weak). An induced subgraph on person
        # nodes would have no edges at all, since persons only touch case nodes.
        subG = nx.Graph()
        persons_by_location: dict[str, set[str]] = {}
        persons_by_weapon: dict[str, set[str]] = {}

        def _person_ids(fir: dict) -> list[str]:
            names = str(fir.get("accused_name", "")).strip()
            if not names:
                return []
            return [
                f"accused_{n.strip()}"
                for n in names.replace("/", ",").split(",")
                if n.strip()
            ]

        for fir in fir_dicts:
            ids = _person_ids(fir)
            for pid in ids:
                label = pid.removeprefix("accused_")
                subG.add_node(pid, label=label, type="person")
            for i in range(len(ids)):
                for j in range(i + 1, len(ids)):
                    w = subG.get_edge_data(ids[i], ids[j], {}).get("weight", 0)
                    subG.add_edge(ids[i], ids[j], weight=w + 3.0)
            loc = str(fir.get("location", "")).strip()
            wp = str(fir.get("weapon", "")).strip()
            if loc:
                persons_by_location.setdefault(loc, set()).update(ids)
            if wp and wp != "Unknown":
                persons_by_weapon.setdefault(wp, set()).update(ids)

        for group in list(persons_by_location.values()) + list(persons_by_weapon.values()):
            members = sorted(group)
            for i in range(len(members)):
                for j in range(i + 1, len(members)):
                    w = subG.get_edge_data(members[i], members[j], {}).get("weight", 0)
                    subG.add_edge(members[i], members[j], weight=w + 1.0)

        if subG.number_of_nodes() < 3 or subG.number_of_edges() == 0:
            return GangDetectionResponse(
                communities=[],
                total_gangs=0,
                modularity_score=0.0,
            )

        try:
            from networkx.algorithms.community import louvain_communities
            communities_gen = louvain_communities(subG, seed=42)
            communities_list = [list(c) for c in communities_gen]
        except ImportError:
            communities_list = [list(c) for c in nx.community.greedy_modularity_communities(subG)]

        try:
            modularity = nx.community.modularity(subG, communities_list)
        except Exception:
            modularity = 0.0

        result_communities = []
        for i, comm in enumerate(communities_list):
            if len(comm) < 2:
                continue

            degrees = {n: subG.degree(n) for n in comm}
            central_member = max(degrees, key=degrees.get)

            members = []
            for n in comm:
                members.append({
                    "node_id": n,
                    "label": subG.nodes[n].get("label", n),
                    "degree": int(degrees.get(n, 0)),
                })

            result_communities.append({
                "gang_id": i,
                "members": members,
                "size": len(comm),
                "central_member": central_member,
            })

        result_communities.sort(key=lambda c: -c["size"])

        return GangDetectionResponse(
            communities=result_communities,
            total_gangs=len(result_communities),
            modularity_score=round(modularity, 4),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Gang detection failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/influence", response_model=InfluenceResponse)
async def get_influence_scores(firs: list[FIRInput]):
    try:
        fir_dicts = [f.model_dump() for f in firs]

        if not fir_dicts:
            return InfluenceResponse(scores=[], top_influencers=[])

        G = _build_graph(fir_dicts)

        if G.number_of_nodes() == 0:
            return InfluenceResponse(scores=[], top_influencers=[])

        try:
            pagerank = nx.pagerank(G, alpha=0.85)
        except Exception:
            pagerank = {n: 1.0 / G.number_of_nodes() for n in G.nodes()}

        scores = []
        for node_id, score in pagerank.items():
            scores.append({
                "node_id": node_id,
                "label": G.nodes[node_id].get("label", node_id),
                "type": G.nodes[node_id].get("type", "unknown"),
                "pagerank_score": round(float(score), 6),
            })

        scores.sort(key=lambda x: -x["pagerank_score"])
        top_influencers = scores[:10]

        return InfluenceResponse(
            scores=scores,
            top_influencers=top_influencers,
        )
    except Exception as e:
        logger.error(f"Failed to compute influence scores: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/centrality")
async def get_centrality_scores(firs: list[FIRInput]):
    try:
        fir_dicts = [f.model_dump() for f in firs]

        if not fir_dicts:
            return {"scores": [], "top_connectors": []}

        G = _build_graph(fir_dicts)

        if G.number_of_nodes() < 2:
            return {"scores": [], "top_connectors": []}

        try:
            betweenness = nx.betweenness_centrality(G, k=min(100, G.number_of_nodes()), normalized=True)
        except Exception:
            betweenness = {n: 0.0 for n in G.nodes()}

        scores = []
        for node_id, score in betweenness.items():
            scores.append({
                "node_id": node_id,
                "label": G.nodes[node_id].get("label", node_id),
                "type": G.nodes[node_id].get("type", "unknown"),
                "betweenness_score": round(float(score), 6),
            })

        scores.sort(key=lambda x: -x["betweenness_score"])
        top_connectors = scores[:10]

        return {
            "scores": scores,
            "top_connectors": top_connectors,
            "statistics": {
                "max_betweenness": round(float(max(betweenness.values())) if betweenness else 0, 6),
                "avg_betweenness": round(float(np.mean(list(betweenness.values()))) if betweenness else 0, 6),
            },
        }
    except Exception as e:
        logger.error(f"Failed to compute centrality scores: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
