# TBD AI

## Enterprise Product Requirements Document (PRD) + Software Requirements Specification (SRS)

> **Purpose**
>
> This document serves as the **single source of truth** for an AI
> coding agent (Cursor, Claude Code, Codex, Gemini CLI, etc.) to build
> **TBD AI**, an enterprise-grade AI-Driven Crime Analytics &
> Predictive Policing Platform for the Karnataka State Police.

------------------------------------------------------------------------

# 1. Vision

Build a production-quality Crime Intelligence Platform inspired by
**Palantir Gotham**, **IBM i2 Analyst's Notebook**, and **ESRI ArcGIS
Crime Mapping**.

This is **NOT** a CRUD dashboard.

The platform must transform FIR records into actionable intelligence
through AI, graph analytics, geospatial intelligence, predictive
policing, explainable AI, and investigation assistance.

------------------------------------------------------------------------

# 2. Tech Stack

## Frontend

-   Next.js 15 (App Router)
-   React 19
-   TypeScript
-   Tailwind CSS
-   ShadCN UI
-   Framer Motion
-   Recharts
-   D3.js
-   React Flow
-   Mapbox GL JS

## Backend

-   Next.js Route Handlers
-   Python FastAPI (AI/ML microservice)

## Database

-   PostgreSQL
-   Prisma ORM

## Authentication

-   Auth.js (NextAuth)
-   JWT
-   bcrypt

## AI

-   Scikit-learn
-   XGBoost
-   LightGBM
-   Sentence Transformers
-   NetworkX
-   FAISS
-   SHAP
-   PyTorch (optional)
-   GeoPandas
-   Shapely

> **No Docker for the initial version.**

------------------------------------------------------------------------

# 3. Project Goals

-   Transform static FIR records into intelligence.
-   Discover hidden criminal relationships.
-   Predict crime hotspots.
-   Identify organized crime.
-   Assist investigators using natural language.
-   Explain every AI prediction.
-   Deliver a premium enterprise experience.

------------------------------------------------------------------------

# 4. Database

Use the supplied Karnataka Police FIR schema without redesigning it.

Generate a complete Prisma schema with: - relations - indexes - seed
scripts - migrations - repositories - services

------------------------------------------------------------------------

# 5. Folder Structure

Use a scalable monorepo style.

``` text
/apps
   /web
   /ml-service

/packages
   /ui
   /lib
   /types

/prisma
/docs
/scripts
```

------------------------------------------------------------------------

# 6. Authentication & RBAC

Roles

-   Super Admin
-   SCRB Analyst
-   District SP
-   Circle Inspector
-   Police Station Officer
-   Read-only Analyst

Features

-   JWT
-   Refresh tokens
-   Protected routes
-   Middleware
-   Permission system
-   Audit logs

------------------------------------------------------------------------

# 7. UI / UX

Design language

-   Premium
-   Enterprise
-   Dark Mode
-   Glassmorphism
-   Blue intelligence theme
-   Responsive
-   Micro-interactions
-   Skeleton loading
-   Empty states
-   Keyboard shortcuts
-   Command palette

**Never resemble a generic admin dashboard.**

------------------------------------------------------------------------

# 8. Dashboard Modules

-   Executive Dashboard
-   District Dashboard
-   Police Station Dashboard
-   Crime Analytics
-   Officer Dashboard
-   Case Dashboard
-   Intelligence Dashboard

KPIs

-   Crime count
-   Crime trends
-   Pending investigations
-   Chargesheet rate
-   Officer workload
-   Crime category distribution
-   Predictive risk index

------------------------------------------------------------------------

# 9. GIS Intelligence

Implement:

-   Interactive Mapbox maps
-   Heatmaps
-   Cluster maps
-   District drill-down
-   Police station drill-down
-   Timeline replay
-   Polygon search
-   Radius search
-   Predictive hotspot overlays
-   Population overlays
-   Festival overlays
-   Weather overlays

------------------------------------------------------------------------

# 10. Crime DNA Engine

Each FIR receives a fingerprint containing:

-   Crime type
-   MO
-   Time
-   Location
-   Acts
-   Sections
-   Victim profile
-   Accused profile

Generate embeddings.

Support semantic similarity search.

------------------------------------------------------------------------

# 11. Modus Operandi Discovery

Algorithms

-   DBSCAN
-   HDBSCAN
-   KMeans

Outputs

-   Crime families
-   Emerging patterns
-   Serial offender indicators

------------------------------------------------------------------------

# 12. Graph Intelligence

Create interactive graphs.

Nodes

-   Accused
-   Victims
-   Complainants
-   Police stations
-   Courts
-   Districts
-   Acts
-   Sections
-   Cases

Edges

-   Same FIR
-   Same MO
-   Arrested together
-   Shared location
-   Shared officer

Use React Flow + NetworkX.

------------------------------------------------------------------------

# 13. Gang Detection

Algorithms

-   Louvain
-   Leiden
-   Label Propagation

Detect

-   Hidden gangs
-   Emerging communities
-   Criminal organizations

------------------------------------------------------------------------

# 14. Criminal Scores

Generate

-   Influence Score
-   Danger Score
-   Repeat Offender Score
-   Gang Importance
-   Crime Diversity Score

Algorithms

-   PageRank
-   Degree Centrality
-   Eigenvector
-   Betweenness

------------------------------------------------------------------------

# 15. Predictive Analytics

Models

-   XGBoost
-   LightGBM

Predict

-   Crime hotspot
-   Crime probability
-   District risk
-   Police station risk
-   Crime category forecast

------------------------------------------------------------------------

# 16. Anomaly Detection

Algorithms

-   Isolation Forest
-   Local Outlier Factor
-   One-Class SVM

Detect

-   Rare crimes
-   Emerging trends
-   Behavioral anomalies

------------------------------------------------------------------------

# 17. LLM Investigation Assistant

Investigators should ask:

-   Show robberies within 3 km after 9 PM.
-   Find repeat offenders.
-   Find similar FIRs.
-   Show gang members.

Capabilities

-   LLM → SQL
-   Charts
-   Maps
-   Tables
-   Summaries

------------------------------------------------------------------------

# 18. Explainable AI

Every prediction must include

-   Confidence
-   SHAP explanation
-   Feature importance
-   Historical comparison
-   Reasoning

------------------------------------------------------------------------

# 19. Officer Intelligence

-   Pending cases
-   Workload
-   Chargesheet success
-   Investigation duration
-   Resource utilization

------------------------------------------------------------------------

# 20. Resource Optimization

Recommend

-   Patrol deployment
-   Officer allocation
-   Investigation priority

------------------------------------------------------------------------

# 21. Visualizations

Create

-   Sankey
-   Sunburst
-   Treemap
-   Radar
-   Hexbin
-   Chord
-   Force Graph
-   Timeline
-   Heatmap
-   Arc Diagram

------------------------------------------------------------------------

# 22. Performance

Support

-   Millions of FIRs
-   Pagination
-   Virtualization
-   Lazy loading
-   Indexed queries
-   Optimized Prisma usage

------------------------------------------------------------------------

# 23. Security

-   RBAC
-   JWT
-   Rate limiting
-   Input validation
-   Audit logs
-   SQL injection protection
-   CSRF protection

------------------------------------------------------------------------

# 24. Testing

-   Unit Tests
-   Integration Tests
-   API Tests

------------------------------------------------------------------------

# 25. Documentation

Generate

-   README
-   API Docs
-   Architecture Diagram
-   Database Mapping
-   Deployment Guide
-   Future Scope

------------------------------------------------------------------------

# 26. Coding Standards

-   Strict TypeScript
-   ESLint
-   Prettier
-   Reusable components
-   Repository pattern
-   Service layer
-   Clean architecture
-   SOLID principles

------------------------------------------------------------------------

# 27. Final Instruction to the Coding Agent

Do **NOT** generate a basic dashboard.

Always prefer:

-   Intelligence over reporting.
-   Relationships over tables.
-   Prediction over history.
-   Explainability over black-box AI.
-   Investigator workflows over generic analytics.

Every feature should answer:

> **"How does this help an investigator solve or prevent crime?"**

The resulting application should resemble enterprise intelligence
software rather than a hackathon prototype.
