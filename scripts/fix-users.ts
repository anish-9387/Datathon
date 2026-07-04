// One-off repair: the original seed stored a fabricated bcrypt hash, so no
// login could ever succeed. Re-hash Password@123 for all users and create the
// SCRB_ANALYST user that was skipped by the employeeID unique collision.
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = bcrypt.hashSync("Password@123", 10);
  const updated = await prisma.user.updateMany({ data: { password: hash } });
  console.log(`Updated passwords for ${updated.count} users`);

  const scrb = await prisma.user.findUnique({
    where: { email: "scrbanalyst@karnatakapolice.gov.in" },
  });
  if (!scrb) {
    const usedEmployeeIds = (
      await prisma.user.findMany({ where: { employeeID: { not: null } }, select: { employeeID: true } })
    ).map((u) => u.employeeID as number);
    const freeEmployee = await prisma.employee.findFirst({
      where: { EmployeeID: { notIn: usedEmployeeIds } },
    });
    await prisma.user.create({
      data: {
        email: "scrbanalyst@karnatakapolice.gov.in",
        password: hash,
        name: "Mohan Kumar",
        role: Role.SCRB_ANALYST,
        employeeID: freeEmployee?.EmployeeID,
      },
    });
    console.log("Created missing SCRB_ANALYST user");
  }
  console.log("All users now log in with Password@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
