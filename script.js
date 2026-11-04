// ==========================================
// CSA15 – Cloud Computing Dashboard
// SIMATS Academic Workspace
// ==========================================

// ---- Experiment Data ----
const experiments = [
    // Phase 1: E1–E11
    {
        id: 'E1',
        title: 'Flight Reservation System',
        description: 'Cloud software application for Flight Reservation System demonstrating SaaS.',
        platform: 'Firebase Hosting',
        model: 'SaaS',
        status: 'not-started',
        folder: 'LAB/E1',
        appUrl: null,
        phase: 1
    },
    {
        id: 'E2',
        title: 'Property Buying and Rental System',
        description: 'Cloud software application for Property Buying and Rental in Chennai.',
        platform: 'Firebase Hosting',
        model: 'SaaS',
        status: 'not-started',
        folder: 'LAB/E2',
        appUrl: null,
        phase: 1
    },
    {
        id: 'E3',
        title: 'Car Booking Reservation System',
        description: 'Cloud software application for Car Booking Reservation System.',
        platform: 'Firebase Hosting',
        model: 'SaaS',
        status: 'not-started',
        folder: 'LAB/E3',
        appUrl: null,
        phase: 1
    },
    {
        id: 'E4',
        title: 'SIMATS Library Book Reservation System',
        description: 'Cloud software application for SIMATS Library Book Reservation using Google Forms and Sheets.',
        platform: 'Google Forms + Sheets',
        model: 'SaaS',
        status: 'not-started',
        folder: 'LAB/E4',
        appUrl: null,
        phase: 1
    },
    {
        id: 'E5',
        title: 'Mark Sheet Processing System',
        description: 'Cloud software application for Mark Sheet Processing using Google Sheets.',
        platform: 'Google Sheets',
        model: 'SaaS',
        status: 'not-started',
        folder: 'LAB/E5',
        appUrl: null,
        phase: 1
    },
    {
        id: 'E6',
        title: 'Payroll Processing System',
        description: 'Cloud software application for Payroll Processing using Google Sheets.',
        platform: 'Google Sheets',
        model: 'SaaS',
        status: 'not-started',
        folder: 'LAB/E6',
        appUrl: null,
        phase: 1
    },
    {
        id: 'E7',
        title: 'Students Attendance System',
        description: 'Cloud software application for Students Attendance using Google Forms and Sheets.',
        platform: 'Google Forms + Sheets',
        model: 'SaaS',
        status: 'not-started',
        folder: 'LAB/E7',
        appUrl: null,
        phase: 1
    },
    {
        id: 'E8',
        title: 'Student Counselling System',
        description: 'Cloud web application for Student Counselling using Google Forms and Sheets.',
        platform: 'Google Forms + Sheets',
        model: 'SaaS',
        status: 'not-started',
        folder: 'LAB/E8',
        appUrl: null,
        phase: 1
    },
    {
        id: 'E9',
        title: 'SIMATS Hospital Information System',
        description: 'Cloud software application for SIMATS Hospital Information using Google Sheets and AppSheet.',
        platform: 'Google Sheets + AppSheet',
        model: 'SaaS',
        status: 'not-started',
        folder: 'LAB/E9',
        appUrl: null,
        phase: 1
    },
    {
        id: 'E10',
        title: 'C Program to Display Student Information',
        description: 'Cloud software application to run a C program displaying student information using OnlineGDB.',
        platform: 'OnlineGDB',
        model: 'SaaS',
        status: 'not-started',
        folder: 'LAB/E10',
        appUrl: null,
        phase: 1
    },
    {
        id: 'E11',
        title: 'Online Supermarket',
        description: 'Cloud software application for Online Supermarket with product listing and shopping cart.',
        platform: 'Firebase Hosting',
        model: 'SaaS',
        status: 'not-started',
        folder: 'LAB/E11',
        appUrl: null,
        phase: 1
    },

    // Phase 2: E12–E40
    {
        id: 'E12',
        title: 'Virtual Machine Setup and Configuration',
        description: 'Setting up and configuring virtual machines in a cloud environment.',
        platform: 'Cloud Platform',
        model: 'IaaS',
        status: 'not-started',
        folder: 'LAB/E12',
        appUrl: null,
        phase: 2
    },
    {
        id: 'E13',
        title: 'Cloud Storage Service Implementation',
        description: 'Implementing and managing cloud storage services for data persistence.',
        platform: 'Cloud Platform',
        model: 'IaaS',
        status: 'not-started',
        folder: 'LAB/E13',
        appUrl: null,
        phase: 2
    },
    {
        id: 'E14',
        title: 'Load Balancing in Cloud',
        description: 'Configuring load balancers to distribute traffic across cloud instances.',
        platform: 'Cloud Platform',
        model: 'IaaS',
        status: 'not-started',
        folder: 'LAB/E14',
        appUrl: null,
        phase: 2
    },
    {
        id: 'E15',
        title: 'Auto-Scaling Cloud Applications',
        description: 'Implementing auto-scaling policies for cloud-hosted applications.',
        platform: 'Cloud Platform',
        model: 'PaaS',
        status: 'not-started',
        folder: 'LAB/E15',
        appUrl: null,
        phase: 2
    },
    {
        id: 'E16',
        title: 'Cloud Database Management',
        description: 'Managing databases in the cloud including provisioning and querying.',
        platform: 'Cloud Platform',
        model: 'PaaS',
        status: 'not-started',
        folder: 'LAB/E16',
        appUrl: null,
        phase: 2
    },
    {
        id: 'E17',
        title: 'Containerization with Docker',
        description: 'Building and deploying containerized applications using Docker.',
        platform: 'Docker',
        model: 'PaaS',
        status: 'not-started',
        folder: 'LAB/E17',
        appUrl: null,
        phase: 2
    },
    {
        id: 'E18',
        title: 'Container Orchestration with Kubernetes',
        description: 'Orchestrating containers using Kubernetes for scalable deployments.',
        platform: 'Kubernetes',
        model: 'PaaS',
        status: 'not-started',
        folder: 'LAB/E18',
        appUrl: null,
        phase: 2
    },
    {
        id: 'E19',
        title: 'Serverless Computing with Cloud Functions',
        description: 'Developing serverless applications using cloud functions.',
        platform: 'Cloud Functions',
        model: 'FaaS',
        status: 'not-started',
        folder: 'LAB/E19',
        appUrl: null,
        phase: 2
    },
    {
        id: 'E20',
        title: 'Cloud Networking and VPC Configuration',
        description: 'Configuring virtual private clouds and network topologies.',
        platform: 'Cloud Platform',
        model: 'IaaS',
        status: 'not-started',
        folder: 'LAB/E20',
        appUrl: null,
        phase: 2
    },
    {
        id: 'E21',
        title: 'Identity and Access Management',
        description: 'Implementing IAM policies and role-based access controls.',
        platform: 'Cloud Platform',
        model: 'Security',
        status: 'not-started',
        folder: 'LAB/E21',
        appUrl: null,
        phase: 2
    },
    {
        id: 'E22',
        title: 'Cloud Monitoring and Logging',
        description: 'Setting up monitoring dashboards and logging pipelines.',
        platform: 'Cloud Platform',
        model: 'PaaS',
        status: 'not-started',
        folder: 'LAB/E22',
        appUrl: null,
        phase: 2
    },
    {
        id: 'E23',
        title: 'CI/CD Pipeline Implementation',
        description: 'Building continuous integration and deployment pipelines.',
        platform: 'Cloud DevOps',
        model: 'PaaS',
        status: 'not-started',
        folder: 'LAB/E23',
        appUrl: null,
        phase: 2
    },
    {
        id: 'E24',
        title: 'Infrastructure as Code with Terraform',
        description: 'Provisioning cloud infrastructure using Terraform.',
        platform: 'Terraform',
        model: 'IaaS',
        status: 'not-started',
        folder: 'LAB/E24',
        appUrl: null,
        phase: 2
    },
    {
        id: 'E25',
        title: 'Big Data Processing with Hadoop',
        description: 'Processing large datasets using Hadoop MapReduce framework.',
        platform: 'Hadoop',
        model: 'Big Data',
        status: 'not-started',
        folder: 'LAB/E25',
        appUrl: null,
        phase: 2
    },
    {
        id: 'E26',
        title: 'MapReduce Programming',
        description: 'Writing MapReduce programs for distributed data processing.',
        platform: 'Hadoop',
        model: 'Big Data',
        status: 'not-started',
        folder: 'LAB/E26',
        appUrl: null,
        phase: 2
    },
    {
        id: 'E27',
        title: 'Apache Spark Data Processing',
        description: 'In-memory data processing and analytics with Apache Spark.',
        platform: 'Apache Spark',
        model: 'Big Data',
        status: 'not-started',
        folder: 'LAB/E27',
        appUrl: null,
        phase: 2
    },
    {
        id: 'E28',
        title: 'Real-Time Data Streaming with Kafka',
        description: 'Building real-time data streaming pipelines with Apache Kafka.',
        platform: 'Apache Kafka',
        model: 'Big Data',
        status: 'not-started',
        folder: 'LAB/E28',
        appUrl: null,
        phase: 2
    },
    {
        id: 'E29',
        title: 'NoSQL Database Operations',
        description: 'Performing CRUD operations on NoSQL databases in the cloud.',
        platform: 'Cloud Platform',
        model: 'PaaS',
        status: 'not-started',
        folder: 'LAB/E29',
        appUrl: null,
        phase: 2
    },
    {
        id: 'E30',
        title: 'Data Warehousing with BigQuery',
        description: 'Building and querying data warehouses using Google BigQuery.',
        platform: 'Google BigQuery',
        model: 'Big Data',
        status: 'not-started',
        folder: 'LAB/E30',
        appUrl: null,
        phase: 2
    },
    {
        id: 'E31',
        title: 'Machine Learning on Cloud',
        description: 'Training and deploying machine learning models on cloud platforms.',
        platform: 'Cloud ML',
        model: 'PaaS',
        status: 'not-started',
        folder: 'LAB/E31',
        appUrl: null,
        phase: 2
    },
    {
        id: 'E32',
        title: 'Cloud Security Implementation',
        description: 'Implementing security best practices and compliance in the cloud.',
        platform: 'Cloud Platform',
        model: 'Security',
        status: 'not-started',
        folder: 'LAB/E32',
        appUrl: null,
        phase: 2
    },
    {
        id: 'E33',
        title: 'API Gateway and Microservices',
        description: 'Building microservices architecture with API gateway integration.',
        platform: 'Cloud Platform',
        model: 'PaaS',
        status: 'not-started',
        folder: 'LAB/E33',
        appUrl: null,
        phase: 2
    },
    {
        id: 'E34',
        title: 'Cloud Backup and Disaster Recovery',
        description: 'Implementing backup strategies and disaster recovery plans.',
        platform: 'Cloud Platform',
        model: 'IaaS',
        status: 'not-started',
        folder: 'LAB/E34',
        appUrl: null,
        phase: 2
    },
    {
        id: 'E35',
        title: 'Multi-Cloud Deployment',
        description: 'Deploying applications across multiple cloud providers.',
        platform: 'Multi-Cloud',
        model: 'IaaS',
        status: 'not-started',
        folder: 'LAB/E35',
        appUrl: null,
        phase: 2
    },
    {
        id: 'E36',
        title: 'Edge Computing Implementation',
        description: 'Implementing edge computing solutions for low-latency processing.',
        platform: 'Edge/Cloud',
        model: 'IaaS',
        status: 'not-started',
        folder: 'LAB/E36',
        appUrl: null,
        phase: 2
    },
    {
        id: 'E37',
        title: 'Cloud Cost Optimization',
        description: 'Analyzing and optimizing cloud resource costs and utilization.',
        platform: 'Cloud Platform',
        model: 'FinOps',
        status: 'not-started',
        folder: 'LAB/E37',
        appUrl: null,
        phase: 2
    },
    {
        id: 'E38',
        title: 'Data Analytics Dashboard',
        description: 'Building interactive data analytics dashboards in the cloud.',
        platform: 'Cloud Platform',
        model: 'Big Data',
        status: 'not-started',
        folder: 'LAB/E38',
        appUrl: null,
        phase: 2
    },
    {
        id: 'E39',
        title: 'Cloud Migration Strategy',
        description: 'Planning and executing cloud migration for on-premises applications.',
        platform: 'Cloud Platform',
        model: 'Strategy',
        status: 'not-started',
        folder: 'LAB/E39',
        appUrl: null,
        phase: 2
    },
    {
        id: 'E40',
        title: 'Hybrid Cloud Architecture',
        description: 'Designing and implementing hybrid cloud architectures.',
        platform: 'Hybrid Cloud',
        model: 'IaaS',
        status: 'not-started',
        folder: 'LAB/E40',
        appUrl: null,
        phase: 2
    }
];

// ---- Dashboard Navigation ----

function showLabDashboard() {
    document.getElementById('main-dashboard').classList.add('hidden');
    document.getElementById('lab-dashboard').classList.remove('hidden');
    renderExperimentCards();
    window.scrollTo(0, 0);
}

function showMainDashboard() {
    document.getElementById('lab-dashboard').classList.add('hidden');
    document.getElementById('main-dashboard').classList.remove('hidden');
    window.scrollTo(0, 0);
}

// ---- Render Experiment Cards ----

function renderExperimentCards(filteredExperiments = null) {
    const grid = document.getElementById('experiments-grid');
    const list = filteredExperiments || experiments;
    const noResults = document.getElementById('no-results');

    if (list.length === 0) {
        grid.innerHTML = '';
        noResults.classList.remove('hidden');
        return;
    }

    noResults.classList.add('hidden');

    grid.innerHTML = list.map((exp, index) => {
        const statusClass = exp.status;
        const statusLabel = getStatusLabel(exp.status);
        const hasApp = exp.appUrl !== null;

        return `
            <div class="exp-card" style="animation-delay: ${Math.min(index * 0.03, 0.5)}s">
                <div class="exp-card-header">
                    <span class="exp-number">${exp.id}</span>
                    <span class="status-badge ${statusClass}">${statusLabel}</span>
                </div>
                <h3 class="exp-title">${exp.title}</h3>
                <p class="exp-desc">${exp.description}</p>
                <div class="exp-meta">
                    <span class="exp-tag">📦 ${exp.platform}</span>
                    <span class="exp-tag">☁️ ${exp.model}</span>
                </div>
                <div class="exp-card-footer">
                    <a href="${exp.folder}/" class="btn btn-secondary" title="View source code">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                        </svg>
                        Source
                    </a>
                    ${hasApp
                        ? `<a href="${exp.appUrl}" target="_blank" class="btn btn-primary" title="Open deployed application">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                <polyline points="15 3 21 3 21 9"/>
                                <line x1="10" y1="14" x2="21" y2="3"/>
                            </svg>
                            Open App
                          </a>`
                        : `<button class="btn btn-primary disabled" disabled title="Not yet deployed">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                            Not Deployed
                          </button>`
                    }
                </div>
            </div>
        `;
    }).join('');
}

// ---- Status Helpers ----

function getStatusLabel(status) {
    const labels = {
        'not-started': 'Not Started',
        'in-progress': 'In Progress',
        'testing': 'Testing',
        'completed': 'Completed'
    };
    return labels[status] || status;
}

// ---- Filter & Search ----

function filterExperiments() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
    const statusFilter = document.getElementById('status-filter').value;
    const phaseFilter = document.getElementById('phase-filter').value;

    let filtered = experiments;

    // Search
    if (searchTerm) {
        filtered = filtered.filter(exp =>
            exp.id.toLowerCase().includes(searchTerm) ||
            exp.title.toLowerCase().includes(searchTerm) ||
            exp.description.toLowerCase().includes(searchTerm) ||
            exp.platform.toLowerCase().includes(searchTerm) ||
            exp.model.toLowerCase().includes(searchTerm)
        );
    }

    // Status filter
    if (statusFilter !== 'all') {
        filtered = filtered.filter(exp => exp.status === statusFilter);
    }

    // Phase filter
    if (phaseFilter === 'phase1') {
        filtered = filtered.filter(exp => exp.phase === 1);
    } else if (phaseFilter === 'phase2') {
        filtered = filtered.filter(exp => exp.phase === 2);
    }

    renderExperimentCards(filtered);
}

// ---- Update Stats ----

function updateStats() {
    const total = experiments.length;
    const completed = experiments.filter(e => e.status === 'completed').length;
    const inProgress = experiments.filter(e => e.status === 'in-progress' || e.status === 'testing').length;
    const notStarted = experiments.filter(e => e.status === 'not-started').length;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-completed').textContent = completed;
    document.getElementById('stat-progress').textContent = inProgress;
    document.getElementById('stat-not-started').textContent = notStarted;
}

// ---- Initialize ----

document.addEventListener('DOMContentLoaded', () => {
    updateStats();
});

