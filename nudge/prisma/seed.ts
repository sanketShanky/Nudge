import { PrismaClient, Plan, MemberRole, MeetingStatus, ActionStatus, Priority, TranscriptSource } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create demo org
  const org = await prisma.organization.upsert({
    where: { slug: "acme-corp" },
    update: {},
    create: {
      name: "Acme Corp",
      slug: "acme-corp",
      plan: Plan.TEAM,
    },
  });

  // Create users
  const usersTemplate = [
    { email: "admin@acme.com", name: "Admin User" },
    { email: "alice@acme.com", name: "Alice" },
    { email: "bob@acme.com", name: "Bob" },
  ];

  const dbUsers = [];
  for (const t of usersTemplate) {
    const u = await prisma.user.upsert({
      where: { email: t.email },
      update: {},
      create: {
        email: t.email,
        name: t.name,
        // Standard user password for testing, handled by Supabase but we create Prisma records manually if we want to query them
      },
    });
    dbUsers.push(u);

    // Make them org members
    await prisma.member.upsert({
      where: {
        userId_organizationId: {
          userId: u.id,
          organizationId: org.id,
        },
      },
      update: {},
      create: {
        userId: u.id,
        organizationId: org.id,
        role: t.email.includes("admin") ? MemberRole.OWNER : MemberRole.MEMBER,
      },
    });
  }

  // Create a meeting
  const meeting = await prisma.meeting.create({
    data: {
      title: "Q1 Planning",
      meetingDate: new Date(),
      duration: 60,
      transcript: "We will build Nudge this quarter.",
      transcriptSource: TranscriptSource.MANUAL,
      status: MeetingStatus.READY,
      summary: "Aligned on Q1 priorities to build Nudge.",
      organizationId: org.id,
      createdById: dbUsers[0].id,
      attendees: {
        create: [
          { email: dbUsers[0].email, name: dbUsers[0].name, userId: dbUsers[0].id },
          { email: dbUsers[1].email, name: dbUsers[1].name, userId: dbUsers[1].id },
        ],
      },
      actionItems: {
        create: [
          {
            title: "Build the auth system",
            dueDate: new Date(Date.now() + 86400000), // tomorrow
            status: ActionStatus.OPEN,
            priority: Priority.HIGH,
            assigneeId: dbUsers[1].id,
          },
          {
            title: "Overdue task example",
            dueDate: new Date(Date.now() - 86400000), // yesterday
            status: ActionStatus.OPEN,
            priority: Priority.URGENT,
            assigneeId: dbUsers[2].id,
          },
        ],
      },
    },
  });

  console.log(`Seeded meeting: ${meeting.title}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
