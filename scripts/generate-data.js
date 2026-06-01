const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Directories to create
const CVS_DIR = path.join(__dirname, '../public/sample-data/cvs');
const JDS_DIR = path.join(__dirname, '../public/sample-data/jds');
const EVAL_DIR = path.join(__dirname, '../eval');

// Ensure directories exist
fs.mkdirSync(CVS_DIR, { recursive: true });
fs.mkdirSync(JDS_DIR, { recursive: true });
fs.mkdirSync(EVAL_DIR, { recursive: true });

// 1. Definition of 5 JDs
const jds = [
  {
    id: 'jd_mern_developer',
    title: 'Full Stack MERN Developer',
    text: `Role: Full Stack MERN Developer
Location: Dubai, UAE (Hybrid)
Experience: 3+ years

We are looking for a Full Stack Developer specializing in the MERN stack.
Required Skills: React, Node.js, Express.js, MongoDB, JavaScript, Git.
Preferred Skills: TypeScript, Next.js, Docker, Tailwind CSS.
Visa Preference: UAE Resident or willing to relocate. Employment visa sponsorship provided.
Seniority Level: Mid-level.

Key Responsibilities:
- Design and implement robust backend APIs using Node and Express.
- Build clean, interactive React user interfaces.
- Perform MongoDB schema modeling and query optimizations.
`
  },
  {
    id: 'jd_data_scientist',
    title: 'Data Scientist',
    text: `Role: Data Scientist
Location: Abu Dhabi, UAE
Experience: 4+ years

Join our analytics team to build advanced prediction models.
Required Skills: Python, SQL, Machine Learning, Pandas, Scikit-learn, Statistics.
Preferred Skills: PyTorch, Tableau, Docker, Git, Cloud Data Warehouses.
Visa Preference: Open. Residency sponsorship available.
Seniority Level: Senior.

Key Responsibilities:
- Clean and analyze structured/unstructured dataset pipelines.
- Build, validate, and deploy statistical and Machine Learning models.
- Present data insights to senior stakeholders.
`
  },
  {
    id: 'jd_tech_recruiter',
    title: 'Technical Recruiter',
    text: `Role: Technical Recruiter
Location: Dubai, UAE (On-site)
Experience: 2+ years

We are seeking a Recruiter with technical sourcing expertise in the Middle East.
Required Skills: Sourcing, HR, Applicant Tracking Systems (ATS), Candidate Interviews, Talent Acquisition, UAE Labor Law.
Preferred Skills: Technical Screening, Onboarding, LinkedIn Recruiter.
Visa Preference: Local Dependent Visa or Golden Visa holders preferred.
Seniority Level: Mid-level.

Key Responsibilities:
- Source and screen engineering, data science, and product candidates.
- Coordinate technical evaluations and conduct culture-fit interviews.
- Ensure compliance with UAE Labor Law and onboarding documentation.
`
  },
  {
    id: 'jd_react_developer',
    title: 'Senior React Developer',
    text: `Role: Senior React Developer
Location: Sharjah, UAE (Remote-friendly)
Experience: 5+ years

We need a Senior Frontend Engineer focused on React and modern rendering architectures.
Required Skills: React, TypeScript, Next.js, Tailwind CSS, State Management, HTML5/CSS3.
Preferred Skills: Redux Toolkit, Webpack, Testing Library, CI/CD pipelines.
Visa Preference: UAE Resident. Golden Visa holders highly encouraged to apply.
Seniority Level: Senior.

Key Responsibilities:
- Optimize React application load times and rendering performance.
- Lead frontend architectures using Next.js App Router and Tailwind.
- Mentor junior frontend developers and review code quality.
`
  },
  {
    id: 'jd_ai_engineer',
    title: 'AI Engineer',
    text: `Role: AI Engineer
Location: Dubai Internet City, UAE
Experience: 5+ years

We are building next-generation cognitive applications and need an AI/NLP specialist.
Required Skills: Python, PyTorch, NLP, LLMs, Vector Databases, Retrieval-Augmented Generation (RAG), Semantic Embeddings.
Preferred Skills: LangChain, TensorFlow, Docker, HuggingFace Transformers, API Integration.
Visa Preference: Open (Golden Visa assistance provided for qualified candidates).
Seniority Level: Senior/Lead.

Key Responsibilities:
- Implement and optimize RAG pipelines using local embedding models and LLMs.
- Train, fine-tune, or prompt-engineer generative models for production.
- Build API integrations between AI systems and MERN microservices.
`
  }
];

// Write JDs to disk
jds.forEach(jd => {
  fs.writeFileSync(path.join(JDS_DIR, `${jd.id}.txt`), jd.text);
});

// 2. Definition of 20 Candidates
const candidates = [
  // --- MERN Developer Applicants (Target: jd_mern_developer) ---
  {
    id: 'cv_mern_1', // Good match
    targetJd: 'jd_mern_developer',
    actual: 'hire',
    name: 'Sajid Rahman',
    experienceYears: 4,
    visa: 'UAE Employment Visa (Current holder)',
    eid: '784-1996-8574129-3',
    dob: '22/10/1996',
    passport: 'P48571295',
    text: `Sajid Rahman
Email: sajid.rahman@gmail.com | Phone: +971 50 482 9172
Location: Dubai Marina, UAE
DOB: 22/10/1996 | Passport: P48571295 | Emirates ID: 784-1996-8574129-3
Current Visa: UAE Employment Visa (Active)

Professional Summary:
Full Stack Developer with 4 years of experience specializing in building web applications using React, Node.js, Express, and MongoDB. Proven track record of developing responsive UIs and optimized REST APIs.

Skills:
React, Node.js, Express.js, MongoDB, JavaScript, TypeScript, Tailwind CSS, Git, HTML, CSS, Redux, REST APIs.

Work Experience:
- Full Stack Engineer (MERN) at TechDubai (Jan 2024 - Present):
  * Built dynamic admin dashboards using React and Tailwind CSS.
  * Created robust backend RESTful APIs with Express and Node.js.
  * Optimized MongoDB queries, reducing load times by 20%.
- Frontend Developer at AppCraft Solutions (Sep 2022 - Dec 2023):
  * Coded responsive web layouts using React and JavaScript.
  * Managed code versions using Git and collaborative workflows.

Education:
- Bachelor of Science in Computer Science | American University of Sharjah (2018 - 2022)`
  },
  {
    id: 'cv_mern_2', // Good match
    targetJd: 'jd_mern_developer',
    actual: 'hire',
    name: 'Amara Lopez',
    experienceYears: 5,
    visa: 'UAE Dependent Visa (Spouse sponsorship)',
    eid: '784-1993-9481726-2',
    dob: '05/03/1993',
    passport: 'A95827361',
    text: `Amara Lopez
Email: amara.l@yahoo.com | Phone: +971 56 123 9845
Sharjah, UAE | Visa Status: UAE Dependent Visa (Spouse Sponsorship)
DOB: 05/03/1993 | Passport: A95827361 | Emirates ID: 784-1993-9481726-2

Summary:
Highly motivated Software Engineer with 5 years of experience in JavaScript web applications. Specializes in Node.js backend development and React frontend integration.

Skills:
React, Node.js, Express, MongoDB, TypeScript, Next.js, Docker, JavaScript, Git, CSS3, SQL.

Experience:
- Senior Full Stack Developer at Globex Gulf (Jun 2023 - Present):
  * Designed scalable microservices in Express.js and Node.js.
  * Integrated MongoDB database with Mongoose ODM schemas.
  * Deployed services inside Docker containers to AWS ECS.
- Software Engineer at WebScale Tech (Jan 2021 - May 2023):
  * Built interactive React portals utilizing custom hooks.
  * Coordinated features using Git with feature branching.

Education:
- BS in Software Engineering | University of Wollongong in Dubai (2016 - 2020)`
  },
  {
    id: 'cv_mern_3', // Poor match (Not MERN, is Py/Data)
    targetJd: 'jd_mern_developer',
    actual: 'reject',
    name: 'Vikram Joshi',
    experienceYears: 4,
    visa: 'Requires Visa Sponsorship',
    eid: '784-1998-1092837-4',
    dob: '17/07/1998',
    passport: 'J12039485',
    text: `Vikram Joshi
Email: vikram.j@gmail.com | Phone: 052-192-8374
Abu Dhabi, UAE | Visa: Requires Employment Visa Sponsorship
DOB: 17/07/1998 | Passport: J12039485 | Emirates ID: 784-1998-1092837-4

Professional Summary:
Data Analyst and Python programmer with 4 years of experience. Skilled in data wrangling, data mining, and SQL queries. Looking to transition into web development.

Skills:
Python, SQL, Pandas, NumPy, Tableau, Data Warehousing, Statistics, Git, Basic HTML/CSS.

Experience:
- Data Analyst at Abu Dhabi Analytics (Mar 2022 - Present):
  * Wrote SQL queries to extract data from Snowflake databases.
  * Generated business dashboards in Tableau.
- Python Developer at Infotech (Feb 2021 - Feb 2022):
  * Processed CSV data feeds using Python Pandas.

Education:
- B.Tech in Information Technology | UAE University (2017 - 2020)`
  },
  {
    id: 'cv_mern_4', // Poor match (Junior, lacks backend skills)
    targetJd: 'jd_mern_developer',
    actual: 'reject',
    name: 'Zara Al-Mansoori',
    experienceYears: 1,
    visa: 'UAE Golden Visa holder',
    eid: '784-2002-3928173-9',
    dob: '01/01/2002',
    passport: 'Z93827164',
    text: `Zara Al-Mansoori
Email: zara.al@gmail.com | Phone: +971 50 111 2222
Dubai, UAE | Visa: UAE Golden Visa (10 Years Residency)
DOB: 01/01/2002 | Passport: Z93827164 | Emirates ID: 784-2002-3928173-9

Summary:
Junior Frontend enthusiast looking for an entry-level position. Strong foundation in JavaScript, HTML, and CSS. Exposed to React.

Skills:
JavaScript, React (basic), HTML5, CSS3, Tailwind CSS, Git.

Experience:
- Frontend Intern at StartUp DXB (Jun 2025 - Dec 2025):
  * Styled landing pages using Tailwind CSS and HTML.
  * Maintained repository commits via Git.

Education:
- Diploma in Web Design | Middlesex University Dubai (2022 - 2025)`
  },

  // --- Data Scientist Applicants (Target: jd_data_scientist) ---
  {
    id: 'cv_data_1', // Good match
    targetJd: 'jd_data_scientist',
    actual: 'hire',
    name: 'Dr. Elena Smirnova',
    experienceYears: 6,
    visa: 'UAE Golden Visa holder',
    eid: '784-1989-2837194-5',
    dob: '14/11/1989',
    passport: 'E84920194',
    text: `Dr. Elena Smirnova
Email: elena.smirnova@datahub.ae | Phone: +971 52 384 1928
Dubai, UAE | Visa Status: UAE Golden Visa (Specialist/Researcher)
DOB: 14/11/1989 | Passport: E84920194 | Emirates ID: 784-1989-2837194-5

Summary:
Data Scientist with 6 years of experience building predictive models and statistical algorithms. Deep expertise in machine learning libraries, SQL databases, and data architectures.

Skills:
Python, SQL, Machine Learning, Pandas, Scikit-learn, Statistics, PyTorch, TensorFlow, Docker, Git, Spark.

Experience:
- Senior Data Scientist at Dubai Smart City (Jan 2023 - Present):
  * Engineered traffic prediction models using Python Scikit-learn.
  * Optimized complex SQL queries in PostgreSQL, improving data fetch by 40%.
  * Dockerized model inference endpoints for web API consumption.
- Data Scientist at Al Futtaim Group (Aug 2020 - Dec 2022):
  * Conducted customer segmentation using Pandas and machine learning.
  * Managed version control with Git.

Education:
- PhD in Applied Statistics | Khalifa University (2017 - 2020)`
  },
  {
    id: 'cv_data_2', // Good match
    targetJd: 'jd_data_scientist',
    actual: 'hire',
    name: 'Omar Al-Hassan',
    experienceYears: 5,
    visa: 'Requires Visa Sponsorship',
    eid: '784-1994-3928103-6',
    dob: '30/06/1994',
    passport: 'O98273615',
    text: `Omar Al-Hassan
Email: omar.hassan@outlook.com | Phone: +971 56 294 1029
Abu Dhabi, UAE | Visa Status: Requires sponsorship
DOB: 30/06/1994 | Passport: O98273615 | Emirates ID: 784-1994-3928103-6

Professional Summary:
Analytical Data Scientist with 5 years of industry experience. Proficient in Python statistical packages, SQL data structures, and deploying machine learning models.

Skills:
Python, SQL, Machine Learning, Pandas, Scikit-learn, Git, Tableau, Statistics, Docker, R.

Experience:
- Machine Learning Engineer at Abu Dhabi National Oil Company (ADNOC) (Mar 2022 - Present):
  * Built pipeline anomalies detection systems with PyTorch and Python.
  * Queried Teradata DW utilizing advanced SQL queries.
- Data Analyst at Emaar Properties (Jan 2021 - Feb 2022):
  * Prepared executive statistical reports using Pandas and Tableau.

Education:
- MS in Data Science | UAE University (2018 - 2020)`
  },
  {
    id: 'cv_data_3', // Poor match (Recruiter applying for DS)
    targetJd: 'jd_data_scientist',
    actual: 'reject',
    name: 'Deepika Sen',
    experienceYears: 4,
    visa: 'UAE Dependent Visa',
    eid: '784-1995-1029482-7',
    dob: '18/02/1995',
    passport: 'D29381029',
    text: `Deepika Sen
Email: deepika.sen@recruitment.com | Phone: 055-123-4567
Dubai, UAE | Visa: UAE Dependent Visa (Husband Sponsorship)
DOB: 18/02/1995 | Passport: D29381029 | Emirates ID: 784-1995-1029482-7

Professional Summary:
Talent Acquisition Specialist with 4 years of experience sourcing tech talent. Experienced in managing candidate interviews and recruitment pipelines.

Skills:
Sourcing, ATS, Talent Acquisition, Candidate Interviews, HR, Excel, PowerPoint.

Experience:
- Tech Recruiter at TalentDXB (Jan 2023 - Present):
  * Conducted interviews and technical screenings for candidates.
  * Managed candidate sourcing pipelines.

Education:
- B.Sc. in Psychology | Manipal University Dubai (2014 - 2017)`
  },
  {
    id: 'cv_data_4', // Poor match (Frontend Dev applying for DS)
    targetJd: 'jd_data_scientist',
    actual: 'reject',
    name: 'John Miller',
    experienceYears: 3,
    visa: 'Requires Visa Sponsorship',
    eid: '784-1997-2839182-3',
    dob: '09/09/1997',
    passport: 'M18273645',
    text: `John Miller
Email: john.miller@code.dev | Phone: +971 50 928 3741
Sharjah, UAE | Visa: Requires Sponsorship
DOB: 09/09/1997 | Passport: M18273645 | Emirates ID: 784-1997-2839182-3

Summary:
Frontend developer specializing in React and styling frameworks. Wants to enter Data Science.

Skills:
React, JavaScript, HTML, CSS, Tailwind CSS, Git, Basic Python.

Experience:
- Frontend Engineer at PixelWeb (Sep 2023 - Present):
  * Styled web templates using React and CSS.

Education:
- BS in CS | Heriot-Watt University Dubai (2018 - 2022)`
  },

  // --- Technical Recruiter Applicants (Target: jd_tech_recruiter) ---
  {
    id: 'cv_rec_1', // Good match
    targetJd: 'jd_tech_recruiter',
    actual: 'hire',
    name: 'Fatima Al-Jaber',
    experienceYears: 3,
    visa: 'UAE Dependent Visa (Father sponsorship)',
    eid: '784-2000-1928374-1',
    dob: '12/12/2000',
    passport: 'F28391827',
    text: `Fatima Al-Jaber
Email: fatima.jaber@hrgulf.com | Phone: +971 55 928 3827
Dubai, UAE | Visa: UAE Dependent Visa (Father Sponsorship)
DOB: 12/12/2000 | Passport: F28391827 | Emirates ID: 784-2000-1928374-1

Professional Summary:
HR Specialist with 3 years of talent acquisition experience in the UAE. Expert in technical sourcing, applicant tracking systems, and compliance with UAE Labor Law.

Skills:
Sourcing, HR, Applicant Tracking Systems (ATS), Candidate Interviews, Talent Acquisition, UAE Labor Law, Technical Screening, LinkedIn Recruiter.

Experience:
- Talent Acquisition Associate at GulfCareers (Aug 2023 - Present):
  * Managed candidate sourcing and resumes screening on ATS.
  * Verified onboarding documents according to UAE Labor Law.
- Recruitment Intern at Majid Al Futtaim (Jun 2022 - Jul 2023):
  * Scheduled technical candidate interviews and collected feedback.

Education:
- Bachelor of Business Administration in HR | Zayed University (2018 - 2022)`
  },
  {
    id: 'cv_rec_2', // Good match
    targetJd: 'jd_tech_recruiter',
    actual: 'hire',
    name: 'Sarah Jenkins',
    experienceYears: 4,
    visa: 'UAE Golden Visa holder',
    eid: '784-1992-2819384-2',
    dob: '04/04/1992',
    passport: 'S82736192',
    text: `Sarah Jenkins
Email: sarah.j@talentdxb.com | Phone: +971 56 112 2334
Dubai, UAE | Visa Status: UAE Golden Visa (10 Years Residency)
DOB: 04/04/1992 | Passport: S82736192 | Emirates ID: 784-1992-2819384-2

Summary:
Senior Recruiter specializing in sourcing IT, software development, and executive engineering profiles across the GCC region.

Skills:
Talent Acquisition, Sourcing, Applicant Tracking Systems (ATS), Candidate Interviews, HR, LinkedIn Recruiter, Technical Screening, Onboarding, UAE Labor Law.

Experience:
- Technical Recruiter at Landmark Group (Jan 2022 - Present):
  * Sourced developers and data scientists using LinkedIn Recruiter.
  * Managed interview pipelines on Lever ATS.
- HR Coordinator at Charterhouse Middle East (Oct 2020 - Dec 2021):
  * Coordinated candidate screenings and labor law compliance audits.

Education:
- BA in Human Resources Management | Middlesex University Dubai (2014 - 2018)`
  },
  {
    id: 'cv_rec_3', // Poor match (Backend Dev applying for HR)
    targetJd: 'jd_tech_recruiter',
    actual: 'reject',
    name: 'Rahul Mehta',
    experienceYears: 5,
    visa: 'Requires Visa Sponsorship',
    eid: '784-1995-2819304-6',
    dob: '19/05/1995',
    passport: 'R92837164',
    text: `Rahul Mehta
Email: rahul.mehta@node.dev | Phone: 052-192-3847
Abu Dhabi, UAE | Visa Status: Requires Sponsorship
DOB: 19/05/1995 | Passport: R92837164 | Emirates ID: 784-1995-2819304-6

Summary:
Backend Node.js developer with 5 years experience. Interested in changing career path into HR/Sourcing.

Skills:
Node.js, Express, MongoDB, JavaScript, SQL, API Development.

Experience:
- Backend Engineer at TechSolutions (Sep 2021 - Present):
  * Built database integrations and APIs.

Education:
- B.Sc. Computer Science | BITS Pilani Dubai (2015 - 2019)`
  },
  {
    id: 'cv_rec_4', // Poor match (Data Scientist applying for HR)
    targetJd: 'jd_tech_recruiter',
    actual: 'reject',
    name: 'Lin Cheng',
    experienceYears: 3,
    visa: 'Requires Visa Sponsorship',
    eid: '784-1997-3928174-8',
    dob: '28/08/1997',
    passport: 'L82736451',
    text: `Lin Cheng
Email: lin.cheng@datasci.cn | Phone: +971 50 382 9182
Dubai, UAE | Visa: Requires Sponsorship
DOB: 28/08/1997 | Passport: L82736451 | Emirates ID: 784-1997-3928174-8

Summary:
Data Scientist with experience in building machine learning models. Seeking role in HR recruitment analytics.

Skills:
Python, Statistics, SQL, Pandas, Scikit-learn.

Experience:
- Data Analyst at Majid Al Futtaim (Jun 2023 - Present):
  * Created data reports for corporate KPIs.

Education:
- B.Sc. Statistics | Abu Dhabi University (2019 - 2023)`
  },

  // --- Senior React Developer Applicants (Target: jd_react_developer) ---
  {
    id: 'cv_react_1', // Good match
    targetJd: 'jd_react_developer',
    actual: 'hire',
    name: 'Michael Connor',
    experienceYears: 6,
    visa: 'UAE Golden Visa holder',
    eid: '784-1990-2918273-4',
    dob: '12/03/1990',
    passport: 'C82736154',
    text: `Michael Connor
Email: michael.connor@react.dev | Phone: +971 52 827 3819
Dubai, UAE | Visa: UAE Golden Visa (10 Years Residency)
DOB: 12/03/1990 | Passport: C82736154 | Emirates ID: 784-1990-2918273-4

Summary:
Senior Frontend Developer with 6 years experience specializing in UI development. Expert in React, TypeScript, Next.js, and CSS frameworks like Tailwind.

Skills:
React, TypeScript, Next.js, Tailwind CSS, State Management, HTML5, CSS3, Redux Toolkit, Webpack, Testing Library, Git.

Experience:
- Lead Frontend Developer at Emirates Group (Jan 2023 - Present):
  * Architected corporate travel booking pages using Next.js App Router.
  * Standardized styling systems with Tailwind CSS, reducing CSS bundle size by 30%.
- Senior React Developer at Noon.com (Feb 2020 - Dec 2022):
  * Refactored cart state using Redux Toolkit.
  * Conducted testing using React Testing Library.

Education:
- BS in Web Development | Heriot-Watt University Dubai (2015 - 2019)`
  },
  {
    id: 'cv_react_2', // Good match
    targetJd: 'jd_react_developer',
    actual: 'hire',
    name: 'Lina Al-Fahim',
    experienceYears: 5,
    visa: 'UAE Employment Visa (Current holder)',
    eid: '784-1995-1029384-2',
    dob: '02/09/1995',
    passport: 'L19283746',
    text: `Lina Al-Fahim
Email: lina.alfahim@gulftech.ae | Phone: +971 56 392 8172
Abu Dhabi, UAE | Visa Status: UAE Employment Visa (Active)
DOB: 02/09/1995 | Passport: L19283746 | Emirates ID: 784-1995-1029384-2

Professional Summary:
Passionate Frontend Engineer with 5 years experience. Dedicated to crafting fluid, accessible user interfaces in React and TypeScript.

Skills:
React, TypeScript, Next.js, Tailwind CSS, HTML5, CSS3, Git, Redux, Jest, CI/CD pipelines.

Experience:
- Senior Frontend Developer at ADIB Technology (Mar 2022 - Present):
  * Designed customer banking dashboards in React and TypeScript.
  * Setup CI/CD build actions using Git and GitHub.
- React Developer at Careem (Jan 2021 - Feb 2022):
  * Coded mobile-responsive frontend pages with Tailwind.

Education:
- B.Sc. in Computer Engineering | UAE University (2016 - 2020)`
  },
  {
    id: 'cv_react_3', // Poor match (Recruiter applying for React)
    targetJd: 'jd_react_developer',
    actual: 'reject',
    name: 'Karan Malhotra',
    experienceYears: 4,
    visa: 'Requires Visa Sponsorship',
    eid: '784-1994-3928172-1',
    dob: '20/12/1994',
    passport: 'K29381726',
    text: `Karan Malhotra
Email: karan.m@hrgroup.ae | Phone: 050-987-6543
Dubai, UAE | Visa: Requires Sponsorship
DOB: 20/12/1994 | Passport: K29381726 | Emirates ID: 784-1994-3928172-1

Summary:
Recruitment Specialist with 4 years experience in HR candidate sourcing. Wants to transfer into Frontend.

Skills:
HR, Sourcing, ATS, Sourcing Strategies, Talent Acquisition, Excel.

Experience:
- HR Executive at Hays Dubai (Jan 2022 - Present):
  * Sourced software developers.

Education:
- BBA | Manipal University Dubai (2015 - 2018)`
  },
  {
    id: 'cv_react_4', // Poor match (Junior, only 1 yr experience, no TS/Next)
    targetJd: 'jd_react_developer',
    actual: 'reject',
    name: 'Layla Belhadj',
    experienceYears: 1,
    visa: 'UAE Dependent Visa',
    eid: '784-2001-2093817-4',
    dob: '08/08/2001',
    passport: 'B29381726',
    text: `Layla Belhadj
Email: layla.b@gmail.com | Phone: +971 55 291 0293
Sharjah, UAE | Visa: UAE Dependent Visa (Spouse sponsorship)
DOB: 08/08/2001 | Passport: B29381726 | Emirates ID: 784-2001-2093817-4

Summary:
Junior developer with 1 year experience coding basic web pages. Familiar with HTML and CSS.

Skills:
React (basic), JavaScript, HTML5, CSS3, Tailwind CSS, Git.

Experience:
- Frontend Intern at MediaCorp (Mar 2025 - Present):
  * Edited HTML templates.

Education:
- B.Sc. Information Technology | Zayed University (2020 - 2024)`
  },

  // --- AI Engineer Applicants (Target: jd_ai_engineer) ---
  {
    id: 'cv_ai_1', // Good match
    targetJd: 'jd_ai_engineer',
    actual: 'hire',
    name: 'Zayd Al-Khoori',
    experienceYears: 5,
    visa: 'UAE Golden Visa holder',
    eid: '784-1998-3928174-2',
    dob: '03/03/1998',
    passport: 'Z10293847',
    text: `Zayd Al-Khoori
Email: zayd.alkhoori@ai.ae | Phone: +971 52 192 8374
Dubai, UAE | Visa Status: UAE Golden Visa (10 Years)
DOB: 03/03/1998 | Passport: Z10293847 | Emirates ID: 784-1998-3928174-2

Professional Summary:
AI Research Engineer with 5 years experience. Specialized in Natural Language Processing (NLP), Large Language Models (LLMs), semantic embeddings, and Retrieval-Augmented Generation (RAG).

Skills:
Python, PyTorch, NLP, LLMs, Vector Databases, Retrieval-Augmented Generation (RAG), Semantic Embeddings, LangChain, TensorFlow, Docker, Git.

Experience:
- Machine Learning Engineer at Technology Innovation Institute (TII) (Jan 2023 - Present):
  * Developed and optimized generative RAG models using PyTorch.
  * Implemented local embedding models (sentence-transformers) with Milvus vector DBs.
- AI Developer at G42 (Sep 2020 - Dec 2022):
  * Built semantic search endpoints and integrated them with Node.js APIs.
  * Dockerized model pipelines.

Education:
- MS in Artificial Intelligence | Khalifa University (2018 - 2020)`
  },
  {
    id: 'cv_ai_2', // Good match
    targetJd: 'jd_ai_engineer',
    actual: 'hire',
    name: 'Sophia Patel',
    experienceYears: 6,
    visa: 'Requires Visa Sponsorship',
    eid: '784-1994-2918374-6',
    dob: '14/05/1994',
    passport: 'S19283746',
    text: `Sophia Patel
Email: sophia.patel@cognitive.com | Phone: +971 56 394 8102
Dubai, UAE | Visa: Requires Sponsorship
DOB: 14/05/1994 | Passport: S19283746 | Emirates ID: 784-1994-2918374-6

Professional Summary:
AI Software Engineer with 6 years experience. Expert in Python backend systems, PyTorch modeling, and deploying Large Language Models (LLMs) inside RAG systems.

Skills:
Python, PyTorch, NLP, LLMs, Vector Databases, LangChain, HuggingFace Transformers, Git, Docker, API Integration, SQL, Next.js.

Experience:
- Senior AI Developer at Cognition DXB (Mar 2022 - Present):
  * Optimized LLM fine-tuning pipelines using HuggingFace library.
  * Integrated vector search indexes with Next.js dashboards.
- Python Backend Developer at Careem (Jan 2020 - Feb 2022):
  * Designed Python data-processing pipelines.

Education:
- M.Sc. Data Science | Heriot-Watt University Dubai (2016 - 2018)`
  },
  {
    id: 'cv_ai_3', // Poor match (MERN developer applying for AI)
    targetJd: 'jd_ai_engineer',
    actual: 'reject',
    name: 'Tarek Refaat',
    experienceYears: 4,
    visa: 'UAE Employment Visa (Current holder)',
    eid: '784-1997-2918374-1',
    dob: '05/06/1997',
    passport: 'T19283746',
    text: `Tarek Refaat
Email: tarek.r@gulfweb.com | Phone: 055-384-9182
Abu Dhabi, UAE | Visa Status: UAE Employment Visa (Active)
DOB: 05/06/1997 | Passport: T19283746 | Emirates ID: 784-1997-2918374-1

Summary:
Web developer with 4 years of experience building React interfaces and Node APIs. No prior machine learning experience.

Skills:
React, Node.js, Express, MongoDB, JavaScript, HTML, CSS, Git.

Experience:
- MERN Developer at GulfWeb (Jan 2022 - Present):
  * Built frontend forms and Node endpoints.

Education:
- B.Sc. Software Engineering | Abu Dhabi University (2017 - 2021)`
  },
  {
    id: 'cv_ai_4', // Poor match (HR recruiter applying for AI)
    targetJd: 'jd_ai_engineer',
    actual: 'reject',
    name: 'Melissa Vance',
    experienceYears: 3,
    visa: 'UAE Dependent Visa',
    eid: '784-1999-1928374-9',
    dob: '12/12/1999',
    passport: 'V92837164',
    text: `Melissa Vance
Email: melissa.v@outlook.com | Phone: +971 50 281 9283
Dubai, UAE | Visa: UAE Dependent Visa (Spouse Sponsorship)
DOB: 12/12/1999 | Passport: V92837164 | Emirates ID: 784-1999-1928374-9

Summary:
Sourcing analyst and HR coordinator with 3 years of recruitment experience. Seeking transition into tech.

Skills:
Talent Acquisition, Sourcing, ATS, Interviews.

Experience:
- Recruiter at Recruit DXB (Jun 2023 - Present):
  * Evaluated resume profiles.

Education:
- B.A. Management | Zayed University (2019 - 2023)`
  }
];

// Helper to write text files for CVs
function writeTxtCvs() {
  console.log("Writing plain text formats of CVs...");
  candidates.forEach(cand => {
    fs.writeFileSync(path.join(CVS_DIR, `${cand.id}.txt`), cand.text);
  });
}

// 3. Helper function to generate PDF for a candidate using PDFKit
function generatePdfCv(candidate, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Design/formatting elements
      doc.fontSize(20).fillColor('#1E3A8A').text(candidate.name, { align: 'center' });
      doc.fontSize(10).fillColor('#4B5563').text(`Email: ${candidate.id}@dummy.com | Phone: +971-50-000-0000`, { align: 'center' });
      doc.text(`DOB: ${candidate.dob} | Passport: ${candidate.passport} | Emirates ID: ${candidate.eid}`, { align: 'center' });
      doc.text(`Visa: ${candidate.visa}`, { align: 'center' });
      doc.moveDown(1.5);

      const addSection = (title, body) => {
        doc.fontSize(14).fillColor('#1E3A8A').text(title);
        doc.moveTo(50, doc.y).lineTo(562, doc.y).strokeColor('#E5E7EB').stroke();
        doc.moveDown(0.5);
        doc.fontSize(11).fillColor('#1F2937').text(body);
        doc.moveDown(1.5);
      };

      const sections = [
        { title: 'Professional Summary', body: 'Experienced specialist with a demonstrated history of working in high-growth environments in the Middle East.' },
        { title: 'Key Technical Skills', body: candidate.text.match(/Skills:\n?([\s\S]*?)\n\n/i)?.[1]?.trim() || 'Software Development, Teamwork, Communication.' },
        { title: 'Work History & Experience', body: candidate.text.match(/Experience:\n?([\s\S]*?)\n\n/i)?.[1]?.trim() || candidate.text.match(/Work Experience:\n?([\s\S]*?)\n\n/i)?.[1]?.trim() || 'Job descriptions.' },
        { title: 'Education', body: candidate.text.substring(candidate.text.indexOf('Education:')) || 'Degree details.' }
      ];

      sections.forEach(sec => addSection(sec.title, sec.body));

      doc.end();
      stream.on('finish', () => resolve());
      stream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

// 4. Generate all files
async function generateAllCvs() {
  console.log("Generating 20 PDF CV files...");
  for (const cand of candidates) {
    const filename = `${cand.id}.pdf`;
    const outputPath = path.join(CVS_DIR, filename);
    await generatePdfCv(cand, outputPath);
  }
  console.log("Successfully generated all PDF CVs.");

  writeTxtCvs();

  const pairsJson = candidates.map(cand => ({
    cv_id: `${cand.id}.pdf`,
    cv_name: cand.name,
    jd_id: `${cand.targetJd}.txt`,
    jd_title: jds.find(j => j.id === cand.targetJd).title,
    actual: cand.actual,
    predicted: '',
    fitScore: 0
  }));

  fs.writeFileSync(
    path.join(EVAL_DIR, 'pairs.json'),
    JSON.stringify(pairsJson, null, 2)
  );
  console.log("Successfully generated eval/pairs.json");
}

generateAllCvs().catch(err => {
  console.error("Data generation failed:", err);
  process.exit(1);
});
