import React, { useState } from 'react';
import { ArrowLeft, Lightbulb, Heart, Share2, BookOpen, TrendingUp, Users, Code, DollarSign, GraduationCap, Leaf, Bot, Palette, Globe } from 'lucide-react';

const TrendingIdeas = ({ onBack, onSelectIdea }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [likedIdeas, setLikedIdeas] = useState(new Set());

  const categories = [
    { id: 'all', name: 'All Ideas', icon: TrendingUp, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { id: 'healthcare', name: 'Healthcare & Biotech', icon: Heart, color: 'bg-gradient-to-r from-red-500 to-pink-500' },
    { id: 'business', name: 'Business & Enterprise', icon: Users, color: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
    { id: 'developers', name: 'Developers & MLOps', icon: Code, color: 'bg-gradient-to-r from-green-500 to-teal-500' },
    { id: 'finance', name: 'Finance', icon: DollarSign, color: 'bg-gradient-to-r from-yellow-500 to-orange-500' },
    { id: 'education', name: 'Education & Learning', icon: GraduationCap, color: 'bg-gradient-to-r from-indigo-500 to-purple-500' },
    { id: 'sustainability', name: 'Sustainability & Environment', icon: Leaf, color: 'bg-gradient-to-r from-emerald-500 to-green-500' },
    { id: 'robotics', name: 'Robotics & Automation', icon: Bot, color: 'bg-gradient-to-r from-slate-500 to-gray-500' },
    { id: 'creativity', name: 'AI in Creativity & Entertainment', icon: Palette, color: 'bg-gradient-to-r from-pink-500 to-rose-500' },
    { id: 'social', name: 'AI for Social Impact & Research', icon: Globe, color: 'bg-gradient-to-r from-cyan-500 to-blue-500' },
    { id: 'niche', name: 'Niche & Emerging AI Applications', icon: Lightbulb, color: 'bg-gradient-to-r from-amber-500 to-yellow-500' }
  ];

  const ideas = [
    // Healthcare & Biotech
    {
      id: 1,
      category: 'healthcare',
      title: 'AI Co-Pilot for Medical Professionals',
      description: 'An AI assistant that leverages micro-LLMs for specific medical fields (e.g., cardiology, oncology) to summarize patient notes, suggest differential diagnoses, and provide real-time access to the latest research, reducing administrative burden and improving diagnostic accuracy.',
      tags: ['Healthcare', 'AI Assistant', 'Medical Research'],
      difficulty: 'Advanced',
      marketSize: 'Large'
    },
    {
      id: 2,
      category: 'healthcare',
      title: 'Personalized Drug Discovery via Generative AI',
      description: 'A platform that uses generative AI to predict novel molecular structures with desired properties, accelerating drug discovery and optimizing drug design for specific targets.',
      tags: ['Drug Discovery', 'Generative AI', 'Biotech'],
      difficulty: 'Expert',
      marketSize: 'Large'
    },
    {
      id: 3,
      category: 'healthcare',
      title: 'AI-Powered Remote Patient Monitoring & Predictive Health',
      description: 'Devices and software using multimodal AI to monitor vital signs, activity, and other health markers, predicting health deteriorations before they become critical, with personalized intervention suggestions.',
      tags: ['IoT', 'Predictive Analytics', 'Remote Monitoring'],
      difficulty: 'Advanced',
      marketSize: 'Large'
    },
    {
      id: 4,
      category: 'healthcare',
      title: 'Automated Medical Imaging Analysis',
      description: 'AI systems for rapid and highly accurate analysis of X-rays, MRIs, and CT scans, identifying anomalies and assisting radiologists in early disease detection.',
      tags: ['Computer Vision', 'Medical Imaging', 'Diagnostics'],
      difficulty: 'Advanced',
      marketSize: 'Large'
    },
    {
      id: 5,
      category: 'healthcare',
      title: 'Ethical AI for Clinical Trial Optimization',
      description: 'An AI platform that optimizes patient recruitment for clinical trials, ensures diverse representation, and monitors trial progress with built-in ethical AI frameworks to prevent bias.',
      tags: ['Clinical Trials', 'Ethical AI', 'Healthcare'],
      difficulty: 'Advanced',
      marketSize: 'Medium'
    },
    // Business & Enterprise
    {
      id: 6,
      category: 'business',
      title: 'Agentic AI for Automated Business Operations',
      description: 'Develop AI agents that autonomously execute complex business processes, from supply chain optimization and logistics to financial reconciliation and project management, learning and adapting over time.',
      tags: ['AI Agents', 'Automation', 'Business Process'],
      difficulty: 'Expert',
      marketSize: 'Large'
    },
    {
      id: 7,
      category: 'business',
      title: 'Micro LLM for Hyper-Personalized Enterprise Support',
      description: 'Specialized, domain-specific LLMs for large enterprises (e.g., for HR, legal, IT, or customer support) that offer highly accurate and context-aware assistance, reducing operational costs.',
      tags: ['LLM', 'Enterprise', 'Customer Support'],
      difficulty: 'Advanced',
      marketSize: 'Large'
    },
    {
      id: 8,
      category: 'business',
      title: 'Generative AI for Marketing & Content Creation',
      description: 'A platform that leverages generative AI to create tailored marketing content (ad copy, email campaigns, social media posts, product descriptions) at scale, adapting to real-time performance data.',
      tags: ['Content Creation', 'Marketing', 'Generative AI'],
      difficulty: 'Intermediate',
      marketSize: 'Large'
    },
    {
      id: 9,
      category: 'business',
      title: 'AI-Powered ESG Reporting Automation',
      description: 'An AI solution that automates the collection, analysis, and reporting of environmental, social, and governance (ESG) data, ensuring compliance and transparency for businesses.',
      tags: ['ESG', 'Compliance', 'Automation'],
      difficulty: 'Advanced',
      marketSize: 'Medium'
    },
    {
      id: 10,
      category: 'business',
      title: 'Intelligent Automation for Cybersecurity Threat Detection',
      description: 'AI systems that use advanced machine learning to analyze network traffic, identify anomalies, and predict sophisticated cyber threats in real-time, adapting to new attack vectors.',
      tags: ['Cybersecurity', 'Threat Detection', 'ML'],
      difficulty: 'Expert',
      marketSize: 'Large'
    },
    {
      id: 11,
      category: 'business',
      title: 'AI for Supply Chain Resilience & Optimization',
      description: 'Predictive AI models that analyze global supply chain data to forecast disruptions, optimize inventory, and suggest alternative routes or suppliers to enhance resilience.',
      tags: ['Supply Chain', 'Predictive Analytics', 'Optimization'],
      difficulty: 'Advanced',
      marketSize: 'Large'
    },
    {
      id: 12,
      category: 'business',
      title: 'AI-Driven Customer Behavior Analytics & Prediction',
      description: 'A platform that uses AI to analyze vast datasets of customer interactions, predicting future purchasing behavior, churn risk, and personalizing engagement strategies.',
      tags: ['Customer Analytics', 'Behavioral Prediction', 'Personalization'],
      difficulty: 'Advanced',
      marketSize: 'Large'
    },
    {
      id: 13,
      category: 'business',
      title: 'Automated Knowledge Graph Construction & Reasoning',
      description: 'An AI service that automatically extracts information from unstructured data (documents, web pages) to build and maintain knowledge graphs for enhanced business intelligence and automated reasoning.',
      tags: ['Knowledge Graphs', 'NLP', 'Business Intelligence'],
      difficulty: 'Expert',
      marketSize: 'Medium'
    },
    {
      id: 14,
      category: 'business',
      title: 'AI for Legal Document Review & Contract Generation',
      description: 'AI tools that rapidly review legal documents for discrepancies, compliance issues, and generate drafts of standard contracts, significantly reducing legal costs and time.',
      tags: ['Legal Tech', 'Document Analysis', 'Contract Generation'],
      difficulty: 'Advanced',
      marketSize: 'Large'
    },
    {
      id: 15,
      category: 'business',
      title: 'Predictive Analytics for Talent Acquisition & Retention',
      description: 'AI models that predict candidate success, identify top talent, and forecast employee churn, helping companies optimize their recruitment and retention strategies.',
      tags: ['HR Tech', 'Talent Analytics', 'Predictive Modeling'],
      difficulty: 'Advanced',
      marketSize: 'Large'
    },
    // Developers & MLOps
    {
      id: 16,
      category: 'developers',
      title: 'MLOps Platform for Model Drift Detection & Remediation',
      description: 'A comprehensive MLOps solution that continuously monitors deployed AI models for drift (performance degradation) and automatically suggests or initiates retraining.',
      tags: ['MLOps', 'Model Monitoring', 'DevOps'],
      difficulty: 'Expert',
      marketSize: 'Medium'
    },
    {
      id: 17,
      category: 'developers',
      title: 'AI-Powered Code Generation & Optimization',
      description: 'Tools that use generative AI to write code snippets, refactor existing code, or optimize performance based on natural language prompts or existing codebase analysis.',
      tags: ['Code Generation', 'Developer Tools', 'AI Assistant'],
      difficulty: 'Advanced',
      marketSize: 'Large'
    },
    {
      id: 18,
      category: 'developers',
      title: 'Data-Centric AI Platform for Model Training',
      description: 'A platform focused on improving model performance by curating, cleaning, and augmenting training data, rather than solely focusing on model architecture.',
      tags: ['Data Engineering', 'ML Platform', 'Data Quality'],
      difficulty: 'Advanced',
      marketSize: 'Medium'
    },
    {
      id: 19,
      category: 'developers',
      title: 'AI for Automated Testing & Quality Assurance',
      description: 'AI systems that generate test cases, execute automated tests, and identify bugs in software applications more efficiently than traditional methods.',
      tags: ['Testing', 'QA', 'Automation'],
      difficulty: 'Advanced',
      marketSize: 'Large'
    },
    {
      id: 20,
      category: 'developers',
      title: 'Cloud Cost Optimization with AI',
      description: 'An AI-driven service that analyzes cloud resource usage patterns and recommends cost-saving measures, automates instance scaling, and identifies inefficiencies.',
      tags: ['Cloud Computing', 'Cost Optimization', 'DevOps'],
      difficulty: 'Intermediate',
      marketSize: 'Large'
    },
    // Finance
    {
      id: 21,
      category: 'finance',
      title: 'AI for Enhanced Fraud Detection & Anti-Money Laundering (AML)',
      description: 'Advanced AI systems that use behavioral analytics and anomaly detection to identify complex fraud patterns and suspicious financial activities in real-time.',
      tags: ['Fraud Detection', 'AML', 'Financial Security'],
      difficulty: 'Expert',
      marketSize: 'Large'
    },
    {
      id: 22,
      category: 'finance',
      title: 'AI-Driven Algorithmic Trading & Portfolio Optimization',
      description: 'Sophisticated AI models that analyze market data, news sentiment, and economic indicators to execute high-frequency trades and optimize investment portfolios.',
      tags: ['Algorithmic Trading', 'Portfolio Management', 'FinTech'],
      difficulty: 'Expert',
      marketSize: 'Large'
    },
    {
      id: 23,
      category: 'finance',
      title: 'AI for Personalized Financial Advisory & Wealth Management',
      description: 'AI-powered platforms that provide tailored financial advice, investment recommendations, and retirement planning based on individual financial goals and risk tolerance.',
      tags: ['Wealth Management', 'Financial Advisory', 'Personalization'],
      difficulty: 'Advanced',
      marketSize: 'Large'
    },
    {
      id: 24,
      category: 'finance',
      title: 'Credit Scoring & Risk Assessment with Explainable AI',
      description: 'AI models that provide more accurate credit risk assessments while offering transparent explanations for their decisions, addressing ethical concerns and regulatory requirements.',
      tags: ['Credit Scoring', 'Risk Assessment', 'Explainable AI'],
      difficulty: 'Advanced',
      marketSize: 'Large'
    },
    // Education & Learning
    {
      id: 25,
      category: 'education',
      title: 'Adaptive Learning Platforms with AI Personalization',
      description: 'AI systems that dynamically adjust educational content and pace based on an individual student\'s learning style, progress, and areas of difficulty.',
      tags: ['Adaptive Learning', 'Personalization', 'EdTech'],
      difficulty: 'Advanced',
      marketSize: 'Large'
    },
    {
      id: 26,
      category: 'education',
      title: 'AI Tutors & Language Learning Companions',
      description: 'Conversational AI agents that provide personalized tutoring, answer questions, and facilitate language practice with real-time feedback and context-aware assistance.',
      tags: ['AI Tutoring', 'Language Learning', 'Conversational AI'],
      difficulty: 'Advanced',
      marketSize: 'Large'
    },
    {
      id: 27,
      category: 'education',
      title: 'AI for Automated Content Creation & Curriculum Design',
      description: 'Generative AI tools that assist educators in creating engaging learning materials, quizzes, and even full course curricula based on specific learning objectives.',
      tags: ['Content Creation', 'Curriculum Design', 'Generative AI'],
      difficulty: 'Intermediate',
      marketSize: 'Medium'
    },
    // Sustainability & Environment
    {
      id: 28,
      category: 'sustainability',
      title: 'AI for Real-Time Emissions Monitoring & Reduction',
      description: 'AI-powered sensors and platforms that track greenhouse gas emissions in industrial facilities, cities, or supply chains, identifying areas for reduction and optimizing energy usage.',
      tags: ['Emissions Monitoring', 'Environmental AI', 'IoT'],
      difficulty: 'Advanced',
      marketSize: 'Large'
    },
    {
      id: 29,
      category: 'sustainability',
      title: 'Predictive AI for Climate Change Impact & Adaptation',
      description: 'Models that forecast the impact of climate change on specific regions or industries (e.g., agriculture, water resources) and suggest data-driven adaptation strategies.',
      tags: ['Climate Modeling', 'Predictive Analytics', 'Environmental Science'],
      difficulty: 'Expert',
      marketSize: 'Large'
    },
    {
      id: 30,
      category: 'sustainability',
      title: 'AI for Renewable Energy Grid Optimization',
      description: 'AI systems that manage and optimize the integration of renewable energy sources into the power grid, predicting supply and demand fluctuations to ensure stability.',
      tags: ['Renewable Energy', 'Grid Optimization', 'Energy Management'],
      difficulty: 'Expert',
      marketSize: 'Large'
    },
    {
      id: 31,
      category: 'sustainability',
      title: 'AI for Waste Management & Recycling Optimization',
      description: 'Computer vision and AI for sorting waste, identifying recyclable materials, and optimizing collection routes for increased efficiency and environmental impact.',
      tags: ['Waste Management', 'Computer Vision', 'Recycling'],
      difficulty: 'Advanced',
      marketSize: 'Medium'
    },
    {
      id: 32,
      category: 'sustainability',
      title: 'AI-Powered Biodiversity Monitoring & Conservation',
      description: 'AI using satellite imagery and sensor data to monitor ecosystems, detect illegal deforestation or poaching, and track wildlife populations for conservation efforts.',
      tags: ['Biodiversity', 'Conservation', 'Satellite Imagery'],
      difficulty: 'Advanced',
      marketSize: 'Medium'
    },
    // Robotics & Automation
    {
      id: 33,
      category: 'robotics',
      title: 'Multimodal AI for Enhanced Robotic Dexterity & Collaboration',
      description: 'AI systems that allow robots to interpret visual, auditory, and tactile inputs to perform complex tasks with greater precision and safely collaborate with humans in manufacturing or logistics.',
      tags: ['Multimodal AI', 'Human-Robot Collaboration', 'Manufacturing'],
      difficulty: 'Expert',
      marketSize: 'Large'
    },
    {
      id: 34,
      category: 'robotics',
      title: 'AI for Autonomous Inspection & Maintenance Drones',
      description: 'Drones equipped with AI for automated inspection of infrastructure (pipelines, power lines, bridges), detecting defects and predicting maintenance needs.',
      tags: ['Autonomous Drones', 'Infrastructure Inspection', 'Predictive Maintenance'],
      difficulty: 'Advanced',
      marketSize: 'Large'
    },
    {
      id: 35,
      category: 'robotics',
      title: 'Agentic AI for Smart Home & Building Management',
      description: 'Autonomous AI agents that manage energy consumption, security, and comfort in smart homes and commercial buildings, learning user preferences and optimizing systems.',
      tags: ['Smart Buildings', 'Agentic AI', 'Energy Management'],
      difficulty: 'Advanced',
      marketSize: 'Large'
    },
    // AI in Creativity & Entertainment
    {
      id: 36,
      category: 'creativity',
      title: 'Generative AI for Interactive Storytelling & Gaming',
      description: 'AI that creates dynamic narratives, character dialogues, and game environments in real-time, adapting to player choices and fostering unique experiences.',
      tags: ['Interactive Storytelling', 'Gaming', 'Dynamic Narratives'],
      difficulty: 'Advanced',
      marketSize: 'Large'
    },
    {
      id: 37,
      category: 'creativity',
      title: 'AI for Personalized Music & Sound Design',
      description: 'Generative AI that composes original music, creates custom sound effects, or personalizes audio experiences for listeners based on mood or activity.',
      tags: ['Music Generation', 'Sound Design', 'Personalization'],
      difficulty: 'Advanced',
      marketSize: 'Medium'
    },
    {
      id: 38,
      category: 'creativity',
      title: 'AI-Powered Virtual Influencers & Digital Avatars',
      description: 'Highly realistic and interactive AI-driven virtual influencers for marketing, entertainment, or customer service, capable of dynamic conversations and content creation.',
      tags: ['Virtual Influencers', 'Digital Avatars', 'Content Creation'],
      difficulty: 'Expert',
      marketSize: 'Large'
    },
    // AI for Social Impact & Research
    {
      id: 39,
      category: 'social',
      title: 'AI for Social Good & Disaster Response',
      description: 'AI platforms that analyze social media and news data to track disaster events, coordinate relief efforts, and identify vulnerable populations.',
      tags: ['Social Good', 'Disaster Response', 'Social Media Analysis'],
      difficulty: 'Advanced',
      marketSize: 'Medium'
    },
    {
      id: 40,
      category: 'social',
      title: 'AI for Scientific Discovery Acceleration',
      description: 'Agentic AI systems that design and execute experiments, analyze research data, and propose new hypotheses in fields like materials science, chemistry, or biology.',
      tags: ['Scientific Discovery', 'Research Automation', 'Hypothesis Generation'],
      difficulty: 'Expert',
      marketSize: 'Large'
    },
    {
      id: 41,
      category: 'social',
      title: 'Ethical AI Auditing & Bias Detection Services',
      description: 'Companies offering independent auditing services to identify and mitigate biases in AI models, ensuring fair and equitable outcomes, especially in sensitive applications.',
      tags: ['AI Ethics', 'Bias Detection', 'Auditing Services'],
      difficulty: 'Expert',
      marketSize: 'Medium'
    },
    // Niche & Emerging AI Applications
    {
      id: 42,
      category: 'niche',
      title: 'AI for Hyper-Personalized Retail Experiences',
      description: 'AI that analyzes real-time in-store behavior and online activity to offer personalized product recommendations, store navigation, and promotions.',
      tags: ['Retail AI', 'Personalization', 'Customer Experience'],
      difficulty: 'Advanced',
      marketSize: 'Large'
    },
    {
      id: 43,
      category: 'niche',
      title: 'AI-Powered Restaurant Operations Optimization',
      description: 'AI systems for demand forecasting, inventory management, staff scheduling, and even menu optimization in restaurants to reduce waste and improve efficiency.',
      tags: ['Restaurant Operations', 'Demand Forecasting', 'Optimization'],
      difficulty: 'Intermediate',
      marketSize: 'Medium'
    },
    {
      id: 44,
      category: 'niche',
      title: 'AI for Smart Agriculture & Crop Optimization',
      description: 'AI using sensor data, satellite imagery, and weather forecasts to optimize irrigation, fertilization, pest control, and predict crop yields for precision farming.',
      tags: ['Smart Agriculture', 'Precision Farming', 'Crop Optimization'],
      difficulty: 'Advanced',
      marketSize: 'Large'
    },
    {
      id: 45,
      category: 'niche',
      title: 'Generative AI for Fashion Design & Trend Forecasting',
      description: 'AI that generates new apparel designs, accessories, and predicts upcoming fashion trends based on market data and historical patterns.',
      tags: ['Fashion Design', 'Trend Forecasting', 'Generative AI'],
      difficulty: 'Advanced',
      marketSize: 'Medium'
    },
    {
      id: 46,
      category: 'niche',
      title: 'AI for Urban Planning & Smart City Management',
      description: 'AI models that optimize traffic flow, public transport routes, energy consumption, and public safety in urban environments.',
      tags: ['Urban Planning', 'Smart Cities', 'Traffic Optimization'],
      difficulty: 'Expert',
      marketSize: 'Large'
    },
    {
      id: 47,
      category: 'niche',
      title: 'AI-Powered Customer Feedback Analysis & Product Improvement',
      description: 'AI that analyzes customer reviews, support tickets, and social media mentions to identify common pain points and suggest product improvements.',
      tags: ['Customer Feedback', 'Product Improvement', 'Sentiment Analysis'],
      difficulty: 'Intermediate',
      marketSize: 'Medium'
    },
    {
      id: 48,
      category: 'niche',
      title: 'Micro LLM for Specialized Professional Services',
      description: 'Develop highly focused LLMs to assist professionals with complex tasks like tax code interpretation, financial modeling, or strategic analysis.',
      tags: ['Micro LLM', 'Professional Services', 'Specialized AI'],
      difficulty: 'Expert',
      marketSize: 'Medium'
    },
    {
      id: 49,
      category: 'niche',
      title: 'AI for Immersive Language Translation & Interpretation',
      description: 'AI systems that provide real-time, context-aware translation and interpretation for nuanced conversations, breaking down language barriers in global business.',
      tags: ['Language Translation', 'Real-time Interpretation', 'Global Business'],
      difficulty: 'Expert',
      marketSize: 'Large'
    },
    {
      id: 50,
      category: 'niche',
      title: 'AI-Powered Virtual Events & Engagement Platforms',
      description: 'AI that analyzes participant engagement in virtual events, personalizes content delivery, and facilitates networking opportunities to enhance the online experience.',
      tags: ['Virtual Events', 'Engagement Analysis', 'Networking'],
      difficulty: 'Advanced',
      marketSize: 'Medium'
    }
  ];

  const filteredIdeas = selectedCategory === 'all' 
    ? ideas 
    : ideas.filter(idea => idea.category === selectedCategory);

  const toggleLike = (ideaId) => {
    const newLikedIdeas = new Set(likedIdeas);
    if (newLikedIdeas.has(ideaId)) {
      newLikedIdeas.delete(ideaId);
    } else {
      newLikedIdeas.add(ideaId);
    }
    setLikedIdeas(newLikedIdeas);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-900/30 text-green-300 border border-green-500/30';
      case 'Intermediate': return 'bg-yellow-900/30 text-yellow-300 border border-yellow-500/30';
      case 'Advanced': return 'bg-orange-900/30 text-orange-300 border border-orange-500/30';
      case 'Expert': return 'bg-red-900/30 text-red-300 border border-red-500/30';
      default: return 'bg-slate-800/30 text-slate-300 border border-slate-500/30';
    }
  };

  const getMarketSizeColor = (size) => {
    switch (size) {
      case 'Small': return 'bg-blue-900/30 text-blue-300 border border-blue-500/30';
      case 'Medium': return 'bg-purple-900/30 text-purple-300 border border-purple-500/30';
      case 'Large': return 'bg-emerald-900/30 text-emerald-300 border border-emerald-500/30';
      default: return 'bg-slate-800/30 text-slate-300 border border-slate-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-black to-black relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-purple-950/5 to-black/95"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(15,10,25,0.08),transparent_85%)]"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-white hover:text-purple-300 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <div className="h-6 w-px bg-slate-600"></div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-6 h-6 text-purple-400" />
                <h1 className="text-xl font-bold text-white">Trending AI Startup Ideas</h1>
              </div>
            </div>
            <div className="text-sm text-slate-400">
              {filteredIdeas.length} ideas available
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
                    selectedCategory === category.id
                      ? `${category.color} text-white shadow-lg transform scale-105`
                      : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-600/50'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="font-medium">{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ideas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIdeas.map((idea) => (
            <div
              key={idea.id}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-700/50 overflow-hidden group hover:transform hover:scale-[1.02] hover:border-purple-500/50"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
                      {idea.title}
                    </h3>
                    <div className="flex items-center space-x-2 mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(idea.difficulty)}`}>
                        {idea.difficulty}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMarketSizeColor(idea.marketSize)}`}>
                        {idea.marketSize} Market
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleLike(idea.id)}
                    className={`p-2 rounded-full transition-colors ${
                      likedIdeas.has(idea.id)
                        ? 'text-red-500 bg-red-50'
                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${likedIdeas.has(idea.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Description */}
                <p className="text-slate-300 text-sm mb-4 line-clamp-4">
                  {idea.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {idea.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-purple-900/30 text-purple-300 text-xs rounded-md font-medium border border-purple-500/30"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-600/50">
                  <button
                    onClick={() => onSelectIdea(idea.title)}
                    className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium shadow-lg hover:shadow-purple-500/25"
                  >
                    <Lightbulb className="w-4 h-4" />
                    <span>Create Mind Map</span>
                  </button>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-slate-400 hover:text-slate-300 transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-slate-300 transition-colors">
                      <BookOpen className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredIdeas.length === 0 && (
          <div className="text-center py-12">
            <Lightbulb className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No ideas found</h3>
            <p className="text-slate-400">Try selecting a different category to see more ideas.</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default TrendingIdeas;