/**
 * AI Insights Analysis Module
 * Provides rule-based and optional AI-powered analysis of student wrong answers
 * Generates lecturer-specific improvement strategies, student study plans, and learning material recommendations
 */

// Common topic keywords for Computer Science courses
const TOPIC_KEYWORDS = {
  computer_architecture: [
    { keyword: "binary", topic: "Binary Operations" },
    { keyword: "arithmetic", topic: "Arithmetic Logic" },
    { keyword: "logic gate", topic: "Logic Gates" },
    { keyword: "adder", topic: "Adders & ALU" },
    { keyword: "memory", topic: "Memory & Storage" },
    { keyword: "cache", topic: "Cache Memory" },
    { keyword: "register", topic: "Registers" },
    { keyword: "instruction", topic: "Instruction Set" },
    { keyword: "cpu", topic: "CPU Architecture" },
    { keyword: "mips", topic: "MIPS Assembly" },
    { keyword: "assembly", topic: "Assembly Language" },
    { keyword: "microprocessor", topic: "Microprocessors" },
    { keyword: "bus", topic: "Bus Systems" },
    { keyword: "addressing", topic: "Addressing Modes" },
    { keyword: "comparator", topic: "Comparators" },
    { keyword: "multiplexer", topic: "Multiplexers" },
    { keyword: "decoder", topic: "Decoders" },
  ],
  computer_networking: [
    { keyword: "ip address", topic: "IP Addressing" },
    { keyword: "subnet", topic: "Subnetting" },
    { keyword: "router", topic: "Routing" },
    { keyword: "switch", topic: "Switching" },
    { keyword: "protocol", topic: "Protocols" },
    { keyword: "tcp", topic: "TCP" },
    { keyword: "udp", topic: "UDP" },
    { keyword: "http", topic: "HTTP/HTTPS" },
    { keyword: "dns", topic: "DNS" },
    { keyword: "osi", topic: "OSI Model" },
    { keyword: "tcp/ip", topic: "TCP/IP Model" },
    { keyword: "firewall", topic: "Firewalls" },
    { keyword: "vlan", topic: "VLANs" },
    { keyword: "nat", topic: "NAT" },
    { keyword: "packet", topic: "Packet Switching" },
    { keyword: "bandwidth", topic: "Bandwidth" },
  ],
  software_engineering: [
    { keyword: "agile", topic: "Agile Methodology" },
    { keyword: "waterfall", topic: "Waterfall Model" },
    { keyword: "testing", topic: "Software Testing" },
    { keyword: "uml", topic: "UML Diagrams" },
    { keyword: "design pattern", topic: "Design Patterns" },
    { keyword: "oop", topic: "Object-Oriented Programming" },
    { keyword: "inheritance", topic: "Inheritance" },
    { keyword: "polymorphism", topic: "Polymorphism" },
    { keyword: "encapsulation", topic: "Encapsulation" },
    { keyword: "git", topic: "Version Control" },
    { keyword: "api", topic: "API Design" },
    { keyword: "database", topic: "Database Design" },
    { keyword: "refactor", topic: "Refactoring" },
    { keyword: "sdlc", topic: "SDLC" },
    { keyword: "requirements", topic: "Requirements Engineering" },
  ],
};

/**
 * Curated learning resources mapped by course and topic
 * These are used for rule-based fallback and as inspiration for AI-generated recommendations
 */
const LEARNING_RESOURCES = {
  computer_architecture: {
    general: [
      {
        topic: "General Computer Architecture",
        resources: [
          {
            type: "📹 Video",
            title: "Crash Course Computer Science",
            description: "Full playlist covering CPU architecture, memory, and logic",
            url: "https://www.youtube.com/playlist?list=PL8dPuuaLjXtNlUrzyH5r6jN9ulIgZBpdo",
          },
          {
            type: "📚 Book",
            title: "Computer Organization and Design (Patterson & Hennessy)",
            description: "The definitive textbook on computer architecture fundamentals",
            url: "",
          },
          {
            type: "🎮 Interactive",
            title: "CPU Simulator",
            description: "Interactive tool to build and simulate CPU operations",
            url: "https://www.cs.cornell.edu/courses/cs3410/2019sp/",
          },
        ],
      },
    ],
    "Binary Operations": [
      {
        type: "📹 Video",
        title: "Binary Numbers and Base Conversion",
        description: "Khan Academy - Complete guide to binary arithmetic",
        url: "https://www.khanacademy.org/computing/computers-and-internet/xcae6f4a7ff015e7d:digital-information",
      },
      {
        type: "🎮 Interactive",
        title: "Binary Game",
        description: "Cisco's Binary Game - practice binary to decimal conversion",
        url: "https://learningnetwork.cisco.com/s/binary-game",
      },
      {
        type: "📄 Article",
        title: "Two's Complement Explained",
        description: "How signed binary numbers work in computing",
        url: "https://www.allaboutcircuits.com/technical-articles/twos-complement-representation-theory-and-examples/",
      },
    ],
    "Logic Gates": [
      {
        type: "📹 Video",
        title: "Logic Gates Explained",
        description: "Computerphile - Visual explanation of all basic gates",
        url: "https://www.youtube.com/watch?v=JQBRzsPhw2w",
      },
      {
        type: "🎮 Interactive",
        title: "Logic Gate Simulator",
        description: "Build and test logic gate circuits online",
        url: "https://logic.ly/demo",
      },
      {
        type: "📄 Article",
        title: "Boolean Algebra Basics",
        description: "Tutorial on Boolean laws and gate reduction",
        url: "https://www.electronics-tutorials.ws/boolean/bool_1.html",
      },
    ],
    "Adders & ALU": [
      {
        type: "📹 Video",
        title: "How Computers Add Numbers",
        description: "From half-adders to ALU - full explanation",
        url: "https://www.youtube.com/watch?v=wvJc9CZcvBc",
      },
      {
        type: "📄 Article",
        title: "ALU Design Tutorial",
        description: "Step-by-step arithmetic logic unit design",
        url: "https://www.geeksforgeeks.org/computer-organization-alu-and-data-path/",
      },
    ],
    "Memory & Storage": [
      {
        type: "📹 Video",
        title: "How Computer Memory Works",
        description: "RAM, ROM, cache explained visually",
        url: "https://www.youtube.com/watch?v=p3q5zWCw8J4",
      },
      {
        type: "📄 Article",
        title: "Memory Hierarchy Explained",
        description: "Understanding cache, RAM, and storage tiers",
        url: "https://www.computerscience.gcse.guru/theory/memory-hierarchy",
      },
    ],
    "Cache Memory": [
      {
        type: "📹 Video",
        title: "Cache Memory Explained",
        description: "Direct mapped, associative, and set-associative cache",
        url: "https://www.youtube.com/watch?v=6jTrOY6Mlts",
      },
      {
        type: "📄 Article",
        title: "Cache Mapping Techniques",
        description: "Comprehensive guide to cache organization",
        url: "https://www.geeksforgeeks.org/cache-memory-in-computer-organization/",
      },
    ],
    "CPU Architecture": [
      {
        type: "📹 Video",
        title: "How a CPU Works",
        description: "In-depth look at CPU pipeline and architecture",
        url: "https://www.youtube.com/watch?v=cNN_tTXABUA",
      },
      {
        type: "📚 Book",
        title: "Computer Architecture: A Quantitative Approach",
        description: "Advanced CPU design and pipelining concepts",
        url: "",
      },
    ],
    "MIPS Assembly": [
      {
        type: "📹 Video",
        title: "MIPS Assembly Programming",
        description: "Complete tutorial series on MIPS",
        url: "https://www.youtube.com/playlist?list=PL9IEJIKnBJjHc0rYxCp2qrSw_pv3rrm7R",
      },
      {
        type: "🎮 Interactive",
        title: "MIPS Simulator (SPIM)",
        description: "Run and debug MIPS assembly code online",
        url: "https://spimsimulator.sourceforge.net/",
      },
    ],
    Registers: [
      {
        type: "📄 Article",
        title: "CPU Registers Overview",
        description: "Types and purposes of CPU registers explained",
        url: "https://www.tutorialspoint.com/computer_fundamentals/computer_registers.htm",
      },
    ],
    "Bus Systems": [
      {
        type: "📹 Video",
        title: "System Buses in Computer Architecture",
        description: "Data, address, and control buses explained",
        url: "https://www.youtube.com/watch?v=7E1zr70bj9Q",
      },
    ],
  },
  computer_networking: {
    general: [
      {
        topic: "General Networking",
        resources: [
          {
            type: "📹 Video",
            title: "Networking Fundamentals",
            description: "Complete free networking course from freeCodeCamp",
            url: "https://www.youtube.com/watch?v=qiQR5rTSshw",
          },
          {
            type: "📚 Book",
            title: "Computer Networking: A Top-Down Approach (Kurose & Ross)",
            description: "The standard textbook for networking courses",
            url: "",
          },
          {
            type: "🎮 Interactive",
            title: "Packet Tracer",
            description: "Cisco's network simulation tool for practice",
            url: "https://www.netacad.com/courses/packet-tracer",
          },
        ],
      },
    ],
    "IP Addressing": [
      {
        type: "📹 Video",
        title: "IP Addressing & Subnetting",
        description: "Complete guide to IPv4 addresses and classes",
        url: "https://www.youtube.com/watch?v=5WfiTHiU1lM",
      },
      {
        type: "🎮 Interactive",
        title: "Subnetting Practice",
        description: "Interactive subnetting calculator and practice",
        url: "https://subnettingpractice.com/",
      },
      {
        type: "📄 Article",
        title: "IPv4 vs IPv6 Differences",
        description: "Key differences and transition mechanisms",
        url: "https://www.cloudflare.com/learning/network-layer/internet-protocol/",
      },
    ],
    Subnetting: [
      {
        type: "📹 Video",
        title: "Subnetting Made Easy",
        description: "Step-by-step subnetting tutorial",
        url: "https://www.youtube.com/watch?v=ZxAwQB8TZsM",
      },
      {
        type: "🎮 Interactive",
        title: "Subnetting Game",
        description: "Practice subnetting with time challenges",
        url: "https://www.subnetting.net/",
      },
    ],
    Routing: [
      {
        type: "📹 Video",
        title: "Routing Protocols Explained",
        description: "OSPF, BGP, EIGRP concepts",
        url: "https://www.youtube.com/watch?v=Z5eZBLH4pZQ",
      },
      {
        type: "📄 Article",
        title: "Distance Vector vs Link State Routing",
        description: "Comparison of routing algorithms",
        url: "https://www.geeksforgeeks.org/distance-vector-routing-vs-link-state-routing/",
      },
      {
        type: "🎮 Interactive",
        title: "Routing Simulation",
        description: "Visualize how packets traverse networks",
        url: "https://www.submarinecablemap.com/",
      },
    ],
    Protocols: [
      {
        type: "📹 Video",
        title: "Network Protocols Overview",
        description: "Common protocols and their functions",
        url: "https://www.youtube.com/watch?v=rPoalUaK0xM",
      },
      {
        type: "📄 Article",
        title: "Protocol Layering Principles",
        description: "Understanding protocol stacks and encapsulation",
        url: "https://www.cloudflare.com/learning/network-layer/what-is-a-protocol/",
      },
    ],
    TCP: [
      {
        type: "📹 Video",
        title: "TCP Connection Management",
        description: "Three-way handshake, flow control, congestion",
        url: "https://www.youtube.com/watch?v=uRwQ9f2hFPs",
      },
      {
        type: "📄 Article",
        title: "TCP vs UDP Comparison",
        description: "When to use each transport protocol",
        url: "https://www.cloudflare.com/learning/ddos/glossary/tcp-vs-udp/",
      },
    ],
    DNS: [
      {
        type: "📹 Video",
        title: "How DNS Works",
        description: "Full DNS resolution process explained",
        url: "https://www.youtube.com/watch?v=mpQZVYPuDGU",
      },
      { type: "🎮 Interactive", title: "DNS Lookup Tool", description: "Trace DNS resolution in real-time", url: "https://dns.google/" },
    ],
    "OSI Model": [
      {
        type: "📹 Video",
        title: "OSI Model Layers",
        description: "Each layer explained with examples",
        url: "https://www.youtube.com/watch?v=0y6FtKsg6J4",
      },
      {
        type: "📄 Article",
        title: "OSI Model Deep Dive",
        description: "Complete reference for all 7 layers",
        url: "https://www.cloudflare.com/learning/ddos/glossary/open-systems-interconnection-model-osi/",
      },
      {
        type: "🎮 Interactive",
        title: "OSI Model Quiz",
        description: "Test your knowledge of the OSI layers",
        url: "https://quizlet.com/2825985/osi-model-flash-cards/",
      },
    ],
    Firewalls: [
      {
        type: "📹 Video",
        title: "Firewall Types and Architecture",
        description: "Packet filter, stateful, and application firewalls",
        url: "https://www.youtube.com/watch?v=kDEX1HXybrU",
      },
      {
        type: "📄 Article",
        title: "Firewall Best Practices",
        description: "Security rules and network segmentation",
        url: "https://www.cisa.gov/news-events/news/understanding-firewalls-home-and-small-office",
      },
    ],
  },
  software_engineering: {
    general: [
      {
        topic: "General Software Engineering",
        resources: [
          {
            type: "📹 Video",
            title: "Software Engineering Crash Course",
            description: "Complete overview of SE principles",
            url: "https://www.youtube.com/watch?v=O753uuutqH8",
          },
          { type: "📚 Book", title: "Software Engineering: A Practitioner's Approach (Pressman)", description: "Comprehensive SE textbook", url: "" },
          {
            type: "🎮 Interactive",
            title: "Coding Game Platform",
            description: "Practice coding challenges with immediate feedback",
            url: "https://www.codewars.com/",
          },
        ],
      },
    ],
    "Agile Methodology": [
      {
        type: "📹 Video",
        title: "Agile Scrum Explained",
        description: "Complete scrum framework walkthrough",
        url: "https://www.youtube.com/watch?v=2Vt7Ik8Ublw",
      },
      {
        type: "📄 Article",
        title: "Agile vs Waterfall Comparison",
        description: "When to use each methodology",
        url: "https://www.atlassian.com/agile/project-management/agile-vs-waterfall",
      },
      {
        type: "🎮 Interactive",
        title: "Scrum Simulation",
        description: "Interactive scrum sprint simulation game",
        url: "https://www.scrum.org/resources/scrum-simulation",
      },
    ],
    "Software Testing": [
      {
        type: "📹 Video",
        title: "Software Testing Tutorial",
        description: "Unit, integration, system, and acceptance testing",
        url: "https://www.youtube.com/watch?v=u6QfIXgjwGQ",
      },
      {
        type: "📄 Article",
        title: "Test-Driven Development (TDD)",
        description: "Red-green-refactor cycle explained",
        url: "https://www.freecodecamp.org/news/test-driven-development-tdd-explained/",
      },
      { type: "📚 Book", title: "Pragmatic Unit Testing (Hunt & Thomas)", description: "Practical guide to effective unit testing", url: "" },
    ],
    "Design Patterns": [
      {
        type: "📹 Video",
        title: "Design Patterns Tutorial",
        description: "Gang of Four patterns explained with examples",
        url: "https://www.youtube.com/playlist?list=PLrhzvIcii6GNjpARdnO4ueTUAVR9eMBpc",
      },
      {
        type: "📄 Article",
        title: "Refactoring Guru - Design Patterns",
        description: "Catalog of all GoF patterns with code examples",
        url: "https://refactoring.guru/design-patterns",
      },
      { type: "📚 Book", title: "Head First Design Patterns", description: "Accessible introduction to design patterns", url: "" },
    ],
    "Object-Oriented Programming": [
      {
        type: "📹 Video",
        title: "OOP Concepts Explained",
        description: "Encapsulation, inheritance, polymorphism",
        url: "https://www.youtube.com/watch?v=SiBw7os-_zI",
      },
      {
        type: "🎮 Interactive",
        title: "OOP Interactive Tutorial",
        description: "Practice OOP principles with hands-on exercises",
        url: "https://www.w3schools.com/java/java_oop.asp",
      },
    ],
    "Version Control": [
      {
        type: "📹 Video",
        title: "Git & GitHub Tutorial",
        description: "Complete git workflow from basics to advanced",
        url: "https://www.youtube.com/watch?v=RGOj5yH7evk",
      },
      {
        type: "🎮 Interactive",
        title: "Learn Git Branching",
        description: "Interactive git visualization and practice",
        url: "https://learngitbranching.js.org/",
      },
      {
        type: "📄 Article",
        title: "Git Best Practices",
        description: "Commit messages, branching strategies, and workflows",
        url: "https://www.git-tower.com/learn/git/ebook/en/command-line/appendix/best-practices",
      },
    ],
    "UML Diagrams": [
      {
        type: "📹 Video",
        title: "UML Diagram Tutorial",
        description: "Class, sequence, use case, and activity diagrams",
        url: "https://www.youtube.com/watch?v=WnMQ8HlmeXc",
      },
      { type: "🎮 Interactive", title: "Online UML Tool", description: "Create UML diagrams directly in browser", url: "https://app.diagrams.net/" },
    ],
    "API Design": [
      {
        type: "📹 Video",
        title: "REST API Design Principles",
        description: "Best practices for building RESTful APIs",
        url: "https://www.youtube.com/watch?v=7YcW25PHnAA",
      },
      {
        type: "📄 Article",
        title: "API Design Guide",
        description: "Google's API design best practices",
        url: "https://cloud.google.com/apis/design",
      },
    ],
    "Database Design": [
      {
        type: "📹 Video",
        title: "Database Normalization",
        description: "1NF, 2NF, 3NF, BCNF explained clearly",
        url: "https://www.youtube.com/watch?v=GFQaEYEc8_8",
      },
      {
        type: "🎮 Interactive",
        title: "SQL Practice Platform",
        description: "Interactive SQL exercises with real databases",
        url: "https://www.sql-practice.com/",
      },
    ],
  },
};

/**
 * Analyze questions and generate learning pathways
 * @param {Array} insights - Array of question insights with wrong counts
 * @param {string} course - Course identifier
 * @returns {Promise<Object>} AI analysis results
 */
export async function generateAIInsights(insights, course) {
  // Try DeepSeek first if API key is available (preferred for more detailed insights)
  const deepseekApiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
  if (deepseekApiKey && insights.length > 0) {
    try {
      const deepseekResult = await getDeepSeekAnalysis(insights, course, deepseekApiKey);
      if (deepseekResult) return deepseekResult;
    } catch (error) {
      console.warn("DeepSeek analysis failed, falling back to OpenAI:", error);
    }
  }

  // Try OpenAI as fallback if API key is available
  const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (openaiApiKey && insights.length > 0) {
    try {
      const openaiResult = await getOpenAIAnalysis(insights, course, openaiApiKey);
      if (openaiResult) return openaiResult;
    } catch (error) {
      console.warn("OpenAI analysis failed, falling back to rule-based:", error);
    }
  }

  // Fall back to rule-based analysis
  return generateRuleBasedInsights(insights, course);
}

/**
 * Rule-based analysis of wrong answers
 */
function generateRuleBasedInsights(insights, course) {
  const keywords = TOPIC_KEYWORDS[course] || [];

  // Calculate statistics
  const totalWrong = insights.reduce((sum, q) => sum + (q.number_of_wrong || 0), 0);
  const avgWrong = insights.length > 0 ? totalWrong / insights.length : 0;

  // Categorize questions by priority
  const highPriority = insights.filter((q) => (q.number_of_wrong || 0) >= 5);
  const mediumPriority = insights.filter((q) => (q.number_of_wrong || 0) >= 2 && (q.number_of_wrong || 0) < 5);

  // Extract topics from questions
  const topicResults = analyzeTopics(insights, keywords);

  // Generate learning pathways
  const learningPathways = generateLearningPathways(topicResults, highPriority);

  // Generate action items
  const actionItems = generateActionItems(highPriority, topicResults, course);

  // Generate learning materials for students
  const learningMaterials = generateLearningMaterials(topicResults, course);

  return {
    summary: {
      totalQuestions: insights.length,
      totalWrongAnswers: totalWrong,
      averageWrongPerQuestion: avgWrong.toFixed(1),
      highPriorityCount: highPriority.length,
      mediumPriorityCount: mediumPriority.length,
    },
    priorityTopics: topicResults.slice(0, 5),
    learningPathways,
    actionItems,
    learningMaterials,
    studentStudyGuide: generateStudentStudyPlan(topicResults, course),
  };
}

/**
 * Generate curated learning material recommendations based on identified weak topics
 */
function generateLearningMaterials(topicResults, course) {
  const courseResources = LEARNING_RESOURCES[course];
  if (!courseResources) return [];

  const materials = [];
  const matchedTopics = new Set();

  // Match identified weak topics to curated resources
  topicResults.slice(0, 5).forEach(({ topic }) => {
    const topicResources = courseResources[topic];
    if (topicResources) {
      matchedTopics.add(topic);
      topicResources.forEach((res) => {
        materials.push({
          topic,
          resourceType: res.type,
          title: res.title,
          description: res.description,
          url: res.url,
          priority: "high",
        });
      });
    }
  });

  // Add general course resources for broader support
  if (courseResources.general) {
    courseResources.general.forEach((group) => {
      // Only add general if we matched specific topics, otherwise students need all help
      const priorityLabel = matchedTopics.size > 0 ? "low" : "medium";
      group.resources.forEach((res) => {
        // Avoid duplicates
        if (!materials.some((m) => m.title === res.title)) {
          materials.push({
            topic: group.topic,
            resourceType: res.type,
            title: res.title,
            description: res.description,
            url: res.url,
            priority: priorityLabel,
          });
        }
      });
    });
  }

  return materials;
}

/**
 * Generate a concise student-focused study plan
 */
function generateStudentStudyPlan(topicResults, course) {
  const topTopics = topicResults.slice(0, 4);
  if (topTopics.length === 0) return null;

  const planSections = topTopics.map((t, i) => ({
    focusArea: t.topic,
    whyImportant: `This area had ${t.count} incorrect answers, indicating many peers struggle with similar concepts.`,
    studyTips: getStudyTipsForTopic(t.topic, course),
  }));

  return {
    title: "Personalized Study Plan",
    summary: `Based on common difficulties in ${course.replace(/_/g, " ")}, focus on these ${topTopics.length} key areas:`,
    sections: planSections,
  };
}

/**
 * Get contextual study tips for a given topic
 */
function getStudyTipsForTopic(topic, course) {
  const tips = {
    "Binary Operations": [
      "Practice converting between binary, decimal, and hex daily",
      "Use the Cisco Binary Game to speed up conversions",
      "Work through examples step-by-step before attempting problems",
    ],
    "Logic Gates": [
      "Draw truth tables for every gate from memory",
      "Build circuits using logic.ly simulator to visualize",
      "Practice simplifying Boolean expressions with Karnaugh maps",
    ],
    Subnetting: [
      "Memorize the subnet mask chart (CIDR notation)",
      "Practice the 'magic number' method for subnet calculation",
      "Use subnetting.net for timed practice drills",
    ],
    TCP: [
      "Draw the three-way handshake diagram from memory",
      "Understand sequence numbers and acknowledgement numbers",
      "Use Wireshark to observe real TCP connections",
    ],
    "Object-Oriented Programming": [
      "Build small projects applying each OOP concept separately",
      "Draw class diagrams before coding to plan relationships",
      "Practice explaining concepts without code first",
    ],
    "Design Patterns": [
      "Focus on the problem each pattern solves, not just the code",
      "Refactor existing code to use patterns for deeper learning",
      "Use flashcards to memorize pattern intent and structure",
    ],
  };

  return (
    tips[topic] || [
      `Review the core concepts of ${topic} from your course notes`,
      `Practice with example problems and check your answers`,
      `Discuss difficult points with classmates or ask your lecturer for clarification`,
    ]
  );
}

/**
 * Analyze topics from question text
 */
function analyzeTopics(insights, keywords) {
  const topicCounts = {};

  insights.forEach((question) => {
    const text = (question.questionText || "").toLowerCase();
    const options = (question.options || []).map((o) => o.toLowerCase());
    const allText = [...options, text].join(" ");

    keywords.forEach(({ keyword, topic }) => {
      if (allText.includes(keyword.toLowerCase())) {
        if (!topicCounts[topic]) {
          topicCounts[topic] = { topic, count: 0, questions: [] };
        }
        topicCounts[topic].count += question.number_of_wrong || 1;
        topicCounts[topic].questions.push(question.questionText.substring(0, 50));
      }
    });
  });

  // If no topics found, create generic categories
  if (Object.keys(topicCounts).length === 0) {
    return insights.slice(0, 5).map((q, i) => ({
      topic: `Concept Area ${i + 1}`,
      count: q.number_of_wrong || 1,
      questions: [q.questionText.substring(0, 50)],
    }));
  }

  return Object.values(topicCounts).sort((a, b) => b.count - a.count);
}

/**
 * Generate learning pathways based on analysis
 */
function generateLearningPathways(topicResults, highPriority) {
  const pathways = [];

  // Remedial focus areas
  const remedial = topicResults.filter((t) => (t.count || 0) >= 5);

  // Core topics with high wrong counts
  const coreTopics = topicResults.slice(0, 3);

  pathways.push({
    title: "Quick Review Session",
    description: `Focus on these high-impact areas with ${highPriority.length} questions frequently missed.`,
    priority: "high",
    topics: remedial.length > 0 ? remedial.slice(0, 3).map((t) => t.topic) : coreTopics.map((t) => t.topic),
    recommendedFormat: "15-minute targeted review before next quiz",
  });

  pathways.push({
    title: "Deep Dive Workshop",
    description: `Extended session covering ${coreTopics.length} key concept areas.`,
    priority: "medium",
    topics: coreTopics.map((t) => t.topic),
    recommendedFormat: "Hands-on workshop with examples and practice",
  });

  pathways.push({
    title: "Student Self-Study Guide",
    description: `Provide students with focused resources for independent learning.`,
    priority: "low",
    topics: topicResults.slice(0, 5).map((t) => t.topic),
    recommendedFormat: "Curated reading list and practice exercises",
  });

  return pathways;
}

/**
 * Generate actionable items for lecturer - more specific and data-driven
 */
function generateActionItems(highPriority, topicResults, course) {
  const actions = [];

  if (highPriority.length > 0) {
    // Extract specific concepts from high-priority questions for targeted advice
    const questionPreview = highPriority.slice(0, 3).map((q) => q.questionText.substring(0, 80));
    const weakTopics = topicResults.slice(0, 3).map((t) => t.topic);

    actions.push({
      type: "immediate",
      icon: "🔴",
      title: "Urgent: Student Knowledge Gaps Identified",
      description: `${highPriority.length} questions were missed 5+ times. Students are struggling specifically with ${weakTopics.join(", ")}. Dedicate part of your next lecture to re-teaching these concepts with fresh examples.`,
      questions: highPriority.map((q) => q.questionText.substring(0, 60)),
      recommendations: [
        `Open next lecture with a ${weakTopics[0] || "key concept"} refresher using a worked example`,
        `Assign ${topicResults[0]?.topic || "struggling concept"} practice as pre-lecture homework`,
        `Use a quick poll or quiz to gauge current understanding before re-teaching`,
      ],
    });
  }

  actions.push({
    type: "focus_area",
    icon: "📚",
    title: "Targeted Teaching Plan for Next Session",
    description: `Student errors cluster around ${topicResults
      .slice(0, 2)
      .map((t) => t.topic)
      .join(" and ")}. Prepare differentiated instruction:`,
    topics: topicResults.slice(0, 3).map((t) => t.topic),
    recommendations: [
      `Prepare visual aids/diagrams specifically for ${topicResults[0]?.topic || "key concepts"}`,
      `Create 3-5 practice questions at varying difficulty for these topics`,
      `Plan think-pair-share activities where students explain concepts to each other`,
      `Share curated learning resources (videos, articles) before the next class`,
    ],
  });

  // Add student performance improvement strategies
  const dataDrivenTips = generateDataDrivenTips(highPriority, topicResults, course);
  actions.push({
    type: "suggestion",
    icon: "💡",
    title: "Evidence-Based Improvement Strategies",
    description: "Based on the specific error patterns observed, here are targeted interventions:",
    recommendations: dataDrivenTips,
  });

  return actions;
}

/**
 * Generate data-driven teaching tips based on actual question patterns
 */
function generateDataDrivenTips(highPriority, topicResults, course) {
  const tips = [];

  if (highPriority.length >= 3) {
    tips.push(
      `Create a concept map connecting the ${topicResults
        .slice(0, 3)
        .map((t) => t.topic)
        .join(", ")} to show relationships between these frequently missed topics`,
    );
  }

  if (topicResults.length > 0) {
    tips.push(`Design a mastery quiz focused exclusively on ${topicResults[0]?.topic || "core concepts"} with immediate feedback`);
    tips.push(`Share the learning materials listed in this analysis directly with students for self-paced review`);
  }

  tips.push(`Consider a 'flipped classroom' approach: assign video tutorials on weak topics as pre-work, use class time for active problem-solving`);
  tips.push(`Create study groups pairing students who mastered these concepts with those still struggling`);

  return tips;
}

/**
 * OpenAI-powered analysis with improved prompt for materials and student study plan
 */
async function getOpenAIAnalysis(insights, course, apiKey) {
  const questionSummaries = insights.slice(0, 10).map((q) => ({
    question: q.questionText,
    wrongCount: q.number_of_wrong,
    correctAnswer: q.correctAnswer,
  }));

  const prompt = `You are an expert Computer Science educator analyzing student performance data. Your task is to provide THREE types of insights:

A) **For the Lecturer:** How to improve teaching and address student misconceptions
B) **For Students:** A personalized study plan with specific areas to focus on
C) **Learning Material Recommendations:** Curated resources for each weak topic

Course: ${course.replace(/_/g, " ").toUpperCase()}

Questions data (sorted by wrong count, most frequent first):
${JSON.stringify(questionSummaries)}

Provide a JSON response with:
1. priorityTopics: array of topics with counts (topic name, count, questions sample)
2. learningPathways: array of 3 suggested pathways (title, description, priority, topics, recommendedFormat)
3. actionItems: array of actionable items for the lecturer with type ("immediate"|"focus_area"|"suggestion"|"misconception"), icon (emoji), title, description, and recommendations (array of specific actions)
4. learningMaterials: array of recommended resources for students with topic (string), resourceType ("📹 Video"|"📄 Article"|"📚 Book"|"🎮 Interactive"), title, description, url (if known), priority ("high"|"medium"|"low"). Suggest REAL resources (YouTube channels like Computerphile, freeCodeCamp; websites like GeeksforGeeks, Cloudflare Learning, Khan Academy, etc.)
5. studentStudyGuide: object with title, summary string, and sections array (each with focusArea, whyImportant, studyTips array)

Focus on practical, specific advice. Return ONLY valid JSON without markdown formatting.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (content) {
    try {
      // Extract JSON from response (OpenAI may wrap in markdown)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Add summary if not present
        if (!parsed.summary) {
          parsed.summary = {
            totalQuestions: insights.length,
            totalWrongAnswers: insights.reduce((s, q) => s + (q.number_of_wrong || 0), 0),
            averageWrongPerQuestion: (insights.reduce((s, q) => s + (q.number_of_wrong || 0), 0) / insights.length).toFixed(1),
            highPriorityCount: insights.filter((q) => (q.number_of_wrong || 0) >= 5).length,
            mediumPriorityCount: insights.filter((q) => (q.number_of_wrong || 0) >= 2 && (q.number_of_wrong || 0) < 5).length,
          };
        }
        // Ensure learningMaterials and studentStudyGuide exist
        if (!parsed.learningMaterials) parsed.learningMaterials = [];
        if (!parsed.studentStudyGuide) parsed.studentStudyGuide = null;
        return parsed;
      }
    } catch (e) {
      console.warn("Failed to parse OpenAI response:", e);
    }
  }

  // Fallback to rule-based if parsing fails
  return null;
}

/**
 * DeepSeek-powered analysis - enhanced to request materials, lecturer strategies, and student study plans
 */
async function getDeepSeekAnalysis(insights, course, apiKey) {
  const questionSummaries = insights.slice(0, 10).map((q) => ({
    question: q.questionText,
    wrongCount: q.number_of_wrong,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation || "",
  }));

  const prompt = `You are an expert Computer Science educator analyzing multiple-choice questions that students frequently get wrong. Provide THREE distinct types of valuable output:

**1. LECTURER-FOCUSED STRATEGIES** — Specific, non-generic advice tied to the actual question content
**2. STUDENT STUDY GUIDE** — A clear, actionable plan students can follow independently
**3. LEARNING MATERIAL RECOMMENDATIONS** — Real resources students can use to improve

Context: Course - ${course.replace(/_/g, " ").toUpperCase()}

Questions data (sorted by wrong count, most frequent first):
${JSON.stringify(questionSummaries, null, 2)}

Analyze these questions comprehensively and provide the following in EXACT JSON format:

1. priorityTopics: array of 5-7 specific topics/subtopics with:
   - topic: string (specific, e.g. "Two's Complement Representation" not "Binary")
   - count: number (total wrong answers for this topic)
   - questions: array of question text snippets

2. learningPathways: array of 3 detailed pathways with:
   - title: specific and actionable (e.g., "Binary Number Systems Mastery Workshop")
   - description: 2-3 sentences explaining WHY students struggle and HOW to address it
   - priority: "high", "medium", or "low"
   - topics: array of 2-4 specific topics
   - recommendedFormat: exact teaching format with time allocation and activity suggestions

3. actionItems: array of 3-4 actionable items for the LECTURER with:
   - type: "immediate" | "focus_area" | "suggestion" | "misconception"
   - icon: emoji
   - title: specific issue
   - description: detailed explanation with pedagogical reasoning tied to the actual questions
   - recommendations: array of concrete, SPECIFIC actions (not generic advice like "use visual aids")

4. learningMaterials: array of recommended learning resources for STUDENTS with:
   - topic: which topic this resource helps with
   - resourceType: use one of these exact prefixes — "📹 Video" | "📄 Article" | "📚 Book" | "🎮 Interactive"
   - title: name of the resource
   - description: what it covers and why it's useful
   - url: known URL or empty string
   - priority: "high" | "medium" | "low"
   Include 5-8 high-quality, real resources (e.g., specific YouTube channels like Computerphile, Core Dumped; sites like GeeksforGeeks, Cloudflare Learning, freeCodeCamp; textbooks; interactive tools)

5. studentStudyGuide: an object with:
   - title: string (e.g., "Your Personalized Study Plan for [Course]")
   - summary: a short paragraph explaining why these areas need focus
   - sections: array of 3-4 objects, each with:
     - focusArea: string (specific topic name)
     - whyImportant: string explaining how many peers struggle with this area
     - studyTips: array of 3-4 specific, actionable study tips

For Computer Science courses, consider:
- Common student misconceptions for each topic based on the actual wrong answers
- Prerequisite knowledge gaps revealed by the question patterns
- Specific hands-on activities, visualizations, and practice exercises to recommend
- Real YouTube channels, websites, and tools that exist (not made up)

Return ONLY valid JSON without any markdown formatting. Do NOT wrap in code blocks.`;

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (content) {
    try {
      // Extract JSON from response (DeepSeek may wrap in markdown)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Add summary if not present
        if (!parsed.summary) {
          parsed.summary = {
            totalQuestions: insights.length,
            totalWrongAnswers: insights.reduce((s, q) => s + (q.number_of_wrong || 0), 0),
            averageWrongPerQuestion: (insights.reduce((s, q) => s + (q.number_of_wrong || 0), 0) / insights.length).toFixed(1),
            highPriorityCount: insights.filter((q) => (q.number_of_wrong || 0) >= 5).length,
            mediumPriorityCount: insights.filter((q) => (q.number_of_wrong || 0) >= 2 && (q.number_of_wrong || 0) < 5).length,
          };
        }
        // Ensure learningMaterials and studentStudyGuide exist
        if (!parsed.learningMaterials) parsed.learningMaterials = [];
        if (!parsed.studentStudyGuide) parsed.studentStudyGuide = null;
        return parsed;
      }
    } catch (e) {
      console.warn("Failed to parse DeepSeek response:", e);
    }
  }

  // Fallback to rule-based if parsing fails
  return null;
}
