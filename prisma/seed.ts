import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Seed Header
  console.log('Seeding header...');
  await prisma.header.upsert({
    where: { id: 'singleton' },
    update: {
      name: 'Daniel Covelli',
      title: 'Senior Software Engineer',
      bio: 'Senior Software Engineer with 4+ years of experience building web and mobile applications. Experienced in TypeScript, React, React Native, GraphQL, and Node.js. Passionate about creating user-friendly interfaces and scalable backend systems.',
      imageUrl: '',
    },
    create: {
      id: 'singleton',
      name: 'Daniel Covelli',
      title: 'Senior Software Engineer',
      bio: 'Senior Software Engineer with 4+ years of experience building web and mobile applications. Experienced in TypeScript, React, React Native, GraphQL, and Node.js. Passionate about creating user-friendly interfaces and scalable backend systems.',
      imageUrl: '',
    },
  });

  // Seed Experience
  console.log('Seeding experience...');
  await prisma.experience.deleteMany({});
  const experiences = [
    {
      jobTitle: 'Senior Software Engineer',
      company: 'Groundswell.io',
      startDate: 'Jun 2021',
      endDate: 'Current',
      description: '',
      bullets: [
        'Promoted twice from SWE Intern to Software Engineer (September 2021) and from Software Engineer to Senior Software Engineer (September 2023)',
        'First engineering hire. Helped grow user base from 0 to ~5k users. Helped grow ARR from $0 to $300k',
        'Lead developer on Mobile app, Web app, and Social Web Product',
        'Worked across platforms helping build features and deploying software to end users, frameworks include React Native, React, Next.js, Express, GraphQL, Prisma, and PostgreSQL',
        'Worked on mobile and web frontend unit and integration tests using React Testing Library, Jest, and Detox',
        'Worked on backend unit and integration tests using Chai, Sinon, and Mocha',
        'Helped configure and define eslint rules for mobile and web to ensure consistent and readable code',
        'Helped review PRs across mobile, backend, and web',
        'Helped monitor and isolate production issues using DataDog',
        'Worked closely with CTO, CEO, and R&D leadership to identify and address process and product optimizations',
        'Helped create first company microservices leveraging GraphQL, HTTP, gRPC, Golang and PostgreSQL',
        'Created UML sequence diagrams describing data and call flows between server, client, and third-party fintech APIs',
      ],
    },
    {
      jobTitle: 'Software Engineering Intern',
      company: 'Mushroom.gg',
      startDate: 'Jan 2021',
      endDate: 'Mar 2021',
      description: '',
      bullets: [
        'Helped early stage social media start-up build out product features and grow daily active user base',
        'Leveraged React to develop responsive front-end components, implemented GraphQL queries and mutations with Apollo caching, updated AWS hosted PostgreSQL database schema via data migrations',
        'Collaborated closely with product, engineering, and design teams to iterate on system design and product features',
      ],
    },
    {
      jobTitle: 'Web Development Intern',
      company: 'Stealth',
      startDate: 'Mar 2020',
      endDate: 'Aug 2020',
      description: '',
      bullets: [
        'Designed reference-based data models and set up REST API using Axios, Express, and MongoDB',
        'Outsourced image storage to Cloudinary API; used bcrypt to hash passwords and JWT to generate login tokens for users',
        'Collaborated with TPM and PM to design database architecture, plan development strategy, and advise founders',
      ],
    },
    {
      jobTitle: 'Course Staff Intern',
      company: 'Berkeley EECS Department (CS88)',
      startDate: 'Jan 2020',
      endDate: 'Mar 2020',
      description: '',
      bullets: [
        'Helped freshman Data Science students learn Python fundamentals including abstraction, data structures, algorithmic thinking, and object oriented programming; other topics included SQL and machine learning',
      ],
    },
    {
      jobTitle: 'Web Automation Intern',
      company: 'Stealth',
      startDate: 'Jan 2019',
      endDate: 'Aug 2019',
      description: '',
      bullets: [
        'Used Selenium with Python to screen 2,000+ clients, investors, and engineers for business development efforts; designed an algorithm to parse subject LinkedIn and Crunchbase profile pages',
      ],
    },
    {
      jobTitle: 'UI/UX Design Consultant',
      company: 'Blockchain at Berkeley',
      startDate: 'Aug 2018',
      endDate: 'May 2019',
      description: '',
      bullets: [
        'Designed several 50+ page UI/UX projects for consulting department',
        'Helped lead design overhaul for clubs website and volunteered to interview candidates for Spring 2019 recruitment',
      ],
    },
  ];

  for (let i = 0; i < experiences.length; i++) {
    const exp = experiences[i];
    await prisma.experience.create({
      data: {
        jobTitle: exp.jobTitle,
        company: exp.company,
        startDate: exp.startDate,
        endDate: exp.endDate,
        description: exp.description || null,
        bullets: exp.bullets,
        sortOrder: i,
      },
    });
  }

  // Seed Education
  console.log('Seeding education...');
  await prisma.education.deleteMany({});
  const educations = [
    {
      degree: 'Interdisciplinary Studies (Data Science and Political Science)',
      institution: 'University of California, Berkeley',
      startDate: 'Fall 2018',
      endDate: 'Fall 2020',
      description: 'Thesis: YouTube and Political Polarization with Dr. Shreeharsh Kelkar. Cum. GPA: 3.402, Major GPA: 3.52, Transfer GPA: 3.8',
      bullets: [
        'CS 88 | Computational Structures',
        'CS 100 | Principles and Techniques of Data Science',
        'Data 8x | Foundations of Data Science',
        'STAT 89A | Linear Algebra for Data Science',
        'IAS 118 | Applied Econometrics',
        'CS 61B | Data Structures',
        'CS 169 | Software Engineering',
        'CS 198 | Cubstart: Intro to iOS',
      ],
    },
  ];

  for (let i = 0; i < educations.length; i++) {
    const edu = educations[i];
    await prisma.education.create({
      data: {
        degree: edu.degree,
        institution: edu.institution,
        startDate: edu.startDate,
        endDate: edu.endDate,
        description: edu.description || null,
        bullets: edu.bullets,
        sortOrder: i,
      },
    });
  }

  // Seed Skill Categories
  console.log('Seeding skills...');
  await prisma.skillCategory.deleteMany({});
  const skillCategories = [
    {
      name: 'Fluent',
      items: ['TypeScript', 'Node.js', 'React', 'React Native', 'GraphQL', 'Apollo', 'git', 'Yarn', 'Express', 'PostgreSQL', 'Next.js', 'Prisma'],
    },
    {
      name: 'Proficient',
      items: ['Python', 'Docker', 'Go', 'yaml', 'Netlify', 'Heroku', 'SQL', 'Java', 'Selenium', 'Capybara', 'RegEx', 'Pandas', 'Ruby on Rails'],
    },
    {
      name: 'Intermediate',
      items: ['WebSockets', 'Redux', 'Swift', 'PyTorch', 'pathlib', 'd3', 'SKLearn', 'SciPy', 'Plotly Dash', 'Matplotlib', 'R', 'AWS'],
    },
    {
      name: 'Services/APIs',
      items: ['Apple Developer Console', 'Google Play Store', 'Plaid', 'Twilio', 'Giphy API', 'Github Rest API', 'YouTube Data API'],
    },
  ];

  for (let i = 0; i < skillCategories.length; i++) {
    const cat = skillCategories[i];
    await prisma.skillCategory.create({
      data: {
        name: cat.name,
        items: cat.items,
        sortOrder: i,
      },
    });
  }

  // Seed Projects
  console.log('Seeding projects...');
  await prisma.project.deleteMany({});
  const projects = [
    {
      name: 'Relia - Migraine Tracking App',
      description: 'A mobile application for tracking migraines and identifying triggers.',
      bullets: ['TypeScript', 'React Native', 'GraphQL', 'Apollo', 'PostgreSQL', 'Docker'],
      githubUrl: null,
      liveUrl: null,
    },
    {
      name: 'NftyFeed - Invitation-Only Social Network for Digital Art',
      description: 'A social network platform for digital artists to share and discover NFT artwork.',
      bullets: ['TypeScript', 'React', 'GraphQL', 'Apollo', 'PostgreSQL', 'Docker'],
      githubUrl: 'https://github.com/daniel-covelli/nfty-feed',
      liveUrl: null,
    },
    {
      name: 'Dev Connector - Social Network for Developers',
      description: 'A social networking platform for developers to connect and collaborate.',
      bullets: ['MongoDB', 'Express', 'React-Redux', 'Node.js'],
      githubUrl: 'https://github.com/daniel-covelli/dev-connect',
      liveUrl: null,
    },
    {
      name: 'Shopping List App',
      description: 'A full-stack shopping list application.',
      bullets: ['MongoDB', 'Express', 'React-Redux', 'Node.js'],
      githubUrl: 'https://github.com/daniel-covelli/shopping-list-app',
      liveUrl: null,
    },
    {
      name: 'COVID-19 Mortality Research Paper',
      description: 'Data analysis research on COVID-19 mortality rates.',
      bullets: ['Python', 'Pandas', 'Seaborn'],
      githubUrl: 'https://gist.github.com/daniel-covelli/0ca59c2c499ecbcb8cf37f57295286c8',
      liveUrl: null,
    },
    {
      name: 'LinkedIn Web Scraper',
      description: 'An optimized web scraper for LinkedIn profiles.',
      bullets: ['Python', 'Xpath', 'Selenium'],
      githubUrl: 'https://github.com/daniel-covelli/optimized-linkedin-scraper',
      liveUrl: null,
    },
  ];

  for (let i = 0; i < projects.length; i++) {
    const proj = projects[i];
    await prisma.project.create({
      data: {
        name: proj.name,
        description: proj.description || null,
        bullets: proj.bullets,
        githubUrl: proj.githubUrl || null,
        liveUrl: proj.liveUrl || null,
        sortOrder: i,
      },
    });
  }

  // Seed Contact
  console.log('Seeding contact...');
  await prisma.contact.upsert({
    where: { id: 'singleton' },
    update: {
      email: 'danielcovelli@berkeley.edu',
      phone: '(818) 231-5126',
      location: '',
      linkedin: 'https://www.linkedin.com/in/daniel-covelli/',
      github: 'https://github.com/daniel-covelli',
      twitter: '',
      website: 'https://danielcovelli.com/',
    },
    create: {
      id: 'singleton',
      email: 'danielcovelli@berkeley.edu',
      phone: '(818) 231-5126',
      location: '',
      linkedin: 'https://www.linkedin.com/in/daniel-covelli/',
      github: 'https://github.com/daniel-covelli',
      twitter: '',
      website: 'https://danielcovelli.com/',
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
