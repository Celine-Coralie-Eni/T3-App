#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Your existing data to import
const users = [
  {
    id: 'cmfs89rt100009pzcvn0enylp',
    name: 'LinkSphere',
    email: 'linksphere3@gmail.com',
    image: 'https://lh3.googleusercontent.com/a/ACg8ocLhC-TjirGsBpusJcX5X-2LmjL3qCHNg0_Z7sToV_Lnd2T8kw=s96-c'
  },
  {
    id: 'cmfs8ae4e00059pzcxk8m149b',
    name: 'Celine-Coralie',
    email: 'celinecoralie0@gmail.com',
    image: 'https://lh3.googleusercontent.com/a/ACg8ocItruFTIKVz3riZ-S9N9PBGVD1ufNUujcezRTgj_WScy_cXIA=s96-c'
  },
  {
    id: 'cmfwctmxc000a9p0bkpuhijut',
    name: 'Michael Ndoh',
    email: 'michaelndoh9@gmail.com',
    image: 'https://lh3.googleusercontent.com/a/ACg8ocJd2t0qkWy_NR3pr9p9zsxR7A4e2-PamSs8L2ze74Cvs_S0pL8=s96-c'
  }
];

const todos = [
  {
    id: 'cmfs8e64e00019p3c47y914np',
    title: 'Do laundry',
    completed: false,
    createdAt: new Date('2025-09-20T12:14:56.126Z'),
    updatedAt: new Date('2025-09-20T12:14:56.126Z'),
    userId: 'cmfs89rt100009pzcvn0enylp'
  },
  {
    id: 'cmfs8eqjl00059p3cmdnqb2gm',
    title: 'Wash the tank',
    completed: false,
    createdAt: new Date('2025-09-20T12:15:22.593Z'),
    updatedAt: new Date('2025-09-20T12:15:22.593Z'),
    userId: 'cmfs89rt100009pzcvn0enylp'
  },
  {
    id: 'cmfs8fj8m00079p3cv23erwxr',
    title: 'Complete Module 2 of Cloud Practitioner',
    completed: true,
    createdAt: new Date('2025-09-20T12:15:59.783Z'),
    updatedAt: new Date('2025-09-20T12:16:04.104Z'),
    userId: 'cmfs89rt100009pzcvn0enylp'
  },
  {
    id: 'cmfs8fsx800099p3crvwr9olm',
    title: 'Complete Module 3 of Cloud Practitioner',
    completed: false,
    createdAt: new Date('2025-09-20T12:16:12.333Z'),
    updatedAt: new Date('2025-09-20T12:16:12.333Z'),
    userId: 'cmfs89rt100009pzcvn0enylp'
  },
  {
    id: 'cmfs8gl37000b9p3c64kys0y5',
    title: 'Revise all what I studied during the week about AWS',
    completed: false,
    createdAt: new Date('2025-09-20T12:16:48.835Z'),
    updatedAt: new Date('2025-09-20T12:16:48.835Z'),
    userId: 'cmfs8ae4e00059pzcxk8m149b'
  },
  {
    id: 'cmfs8gwf8000d9p3c2o4m6un8',
    title: 'Get some stuff from the market',
    completed: false,
    createdAt: new Date('2025-09-20T12:17:03.525Z'),
    updatedAt: new Date('2025-09-20T12:17:03.525Z'),
    userId: 'cmfs8ae4e00059pzcxk8m149b'
  },
  {
    id: 'cmfs8e6fg00039p3cqtkdrkx9',
    title: 'Study Zenstack and practice',
    completed: true,
    createdAt: new Date('2025-09-20T12:14:56.524Z'),
    updatedAt: new Date('2025-09-20T12:17:14.969Z'),
    userId: 'cmfs8ae4e00059pzcxk8m149b'
  },
  {
    id: 'cmfs8v6j3000f9p3ct6uidyli',
    title: 'Go home',
    completed: false,
    createdAt: new Date('2025-09-20T12:28:09.807Z'),
    updatedAt: new Date('2025-09-20T12:28:09.807Z'),
    userId: 'cmfs8ae4e00059pzcxk8m149b'
  },
  {
    id: 'cmfvbeiw500019pqtjgskwkzm',
    title: 'Complete fqdn task',
    completed: false,
    createdAt: new Date('2025-09-22T16:02:30.053Z'),
    updatedAt: new Date('2025-09-22T16:02:30.053Z'),
    userId: 'cmfs89rt100009pzcvn0enylp'
  },
  {
    id: 'cmfw9is4x00039p0b5i0vyk7c',
    title: 'Pray, pray and pray!!',
    completed: false,
    createdAt: new Date('2025-09-23T07:57:35.601Z'),
    updatedAt: new Date('2025-09-23T07:57:35.601Z'),
    userId: 'cmfs8ae4e00059pzcxk8m149b'
  },
  {
    id: 'cmfwctxpu000g9p0bczfjn29i',
    title: 'Go to school',
    completed: false,
    createdAt: new Date('2025-09-23T09:30:14.898Z'),
    updatedAt: new Date('2025-09-23T09:30:36.927Z'),
    userId: 'cmfwctmxc000a9p0bkpuhijut'
  }
];

async function importData() {
  try {
    console.log('Starting data import...');
    
    // Import users first
    console.log('Importing users...');
    for (const user of users) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {},
        create: user
      });
    }
    console.log(`✅ Imported ${users.length} users`);
    
    // Import todos
    console.log('Importing todos...');
    for (const todo of todos) {
      await prisma.todo.upsert({
        where: { id: todo.id },
        update: {},
        create: todo
      });
    }
    console.log(`✅ Imported ${todos.length} todos`);
    
    console.log('🎉 Data import completed successfully!');
    
  } catch (error) {
    console.error('❌ Error importing data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importData();
