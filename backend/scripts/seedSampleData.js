import { generateEmbedding, initializeEmbeddingModel } from '../utils/embeddings.js';

import { chunkBlog } from '../utils/chunking.js';
import { createBlog } from '../services/blogService.js';
import dotenv from 'dotenv';
import { normalizeText } from '../utils/textNormalizer.js';
import pg from 'pg';
import { pool } from '../db/connection.js';

dotenv.config();

const { Pool } = pg;

// Generate diverse blog posts programmatically
function generateBlogPosts(count = 1000) {
  const blogs = [];
  
  // Topic categories with templates
  const topics = [
    // Technology & AI
    { category: 'AI', titles: ['Machine Learning Fundamentals', 'Deep Learning Applications', 'Neural Network Architecture', 'Computer Vision Techniques', 'Natural Language Processing', 'Reinforcement Learning', 'Transfer Learning Methods', 'AI Ethics and Governance', 'Edge AI Computing', 'Federated Learning Systems'] },
    { category: 'Web Dev', titles: ['React Best Practices', 'Node.js Performance', 'RESTful API Design', 'GraphQL Implementation', 'Microservices Architecture', 'Serverless Computing', 'Web Security Essentials', 'Progressive Web Apps', 'TypeScript Advanced Patterns', 'Docker Containerization'] },
    { category: 'Mobile', titles: ['iOS Development Guide', 'Android App Architecture', 'React Native Tips', 'Mobile UI/UX Design', 'App Performance Optimization', 'Mobile Security Practices', 'Cross-Platform Development', 'Mobile Testing Strategies', 'Push Notifications', 'Mobile Analytics'] },
    { category: 'Cloud', titles: ['AWS Cloud Services', 'Azure Infrastructure', 'Google Cloud Platform', 'Cloud Security Best Practices', 'Container Orchestration', 'Serverless Architecture', 'Cloud Cost Optimization', 'Multi-Cloud Strategies', 'DevOps in Cloud', 'Cloud Migration'] },
    
    // Science
    { category: 'Physics', titles: ['Quantum Mechanics Basics', 'Relativity Theory Explained', 'Particle Physics Overview', 'Thermodynamics Principles', 'Electromagnetic Waves', 'Nuclear Physics Applications', 'Astrophysics Discoveries', 'String Theory Introduction', 'Quantum Computing', 'Renewable Energy Physics'] },
    { category: 'Biology', titles: ['Cell Biology Fundamentals', 'Genetics and DNA', 'Evolutionary Biology', 'Marine Biology Research', 'Botany and Plant Science', 'Zoology Studies', 'Microbiology Applications', 'Biochemistry Basics', 'Ecology and Environment', 'Human Anatomy'] },
    { category: 'Chemistry', titles: ['Organic Chemistry Basics', 'Inorganic Compounds', 'Chemical Reactions', 'Biochemistry Principles', 'Analytical Chemistry', 'Physical Chemistry', 'Environmental Chemistry', 'Materials Science', 'Pharmaceutical Chemistry', 'Green Chemistry'] },
    { category: 'Astronomy', titles: ['Solar System Exploration', 'Exoplanet Discovery', 'Black Holes Explained', 'Galaxy Formation', 'Cosmic Microwave Background', 'Stellar Evolution', 'Telescope Technology', 'Space Missions', 'Dark Matter Research', 'Big Bang Theory'] },
    
    // Business & Finance
    { category: 'Startups', titles: ['Startup Funding Strategies', 'MVP Development', 'Product-Market Fit', 'Growth Hacking Techniques', 'Startup Marketing', 'Investor Relations', 'Team Building', 'Scaling Strategies', 'Exit Strategies', 'Lean Startup Methodology'] },
    { category: 'Marketing', titles: ['Digital Marketing Trends', 'SEO Best Practices', 'Content Marketing Strategy', 'Social Media Marketing', 'Email Marketing Campaigns', 'Influencer Marketing', 'Brand Positioning', 'Marketing Analytics', 'Customer Acquisition', 'Marketing Automation'] },
    { category: 'Finance', titles: ['Investment Strategies', 'Personal Finance Tips', 'Cryptocurrency Basics', 'Stock Market Analysis', 'Real Estate Investing', 'Retirement Planning', 'Tax Optimization', 'Financial Planning', 'Risk Management', 'Portfolio Diversification'] },
    { category: 'Management', titles: ['Leadership Principles', 'Team Management', 'Project Management', 'Agile Methodologies', 'Change Management', 'Strategic Planning', 'Organizational Culture', 'Performance Management', 'Conflict Resolution', 'Decision Making'] },
    
    // Health & Fitness
    { category: 'Fitness', titles: ['Strength Training Basics', 'Cardio Workout Plans', 'Nutrition for Athletes', 'Yoga and Flexibility', 'Weight Loss Strategies', 'Muscle Building Tips', 'Recovery Techniques', 'Fitness Equipment Guide', 'Home Workouts', 'Sports Performance'] },
    { category: 'Health', titles: ['Mental Health Awareness', 'Sleep Optimization', 'Stress Management', 'Healthy Eating Habits', 'Preventive Healthcare', 'Chronic Disease Management', 'Wellness Practices', 'Alternative Medicine', 'Health Technology', 'Public Health'] },
    
    // Lifestyle
    { category: 'Travel', titles: ['Budget Travel Tips', 'Solo Travel Guide', 'Adventure Travel', 'Cultural Immersion', 'Travel Photography', 'Sustainable Tourism', 'Travel Planning', 'Backpacking Essentials', 'Travel Safety', 'Hidden Destinations'] },
    { category: 'Food', titles: ['Cooking Techniques', 'Recipe Development', 'Nutrition Science', 'Food Culture', 'Baking Basics', 'International Cuisine', 'Meal Planning', 'Food Photography', 'Restaurant Reviews', 'Food Sustainability'] },
    { category: 'Fashion', titles: ['Fashion Trends', 'Sustainable Fashion', 'Wardrobe Essentials', 'Fashion History', 'Style Tips', 'Fashion Design', 'Accessories Guide', 'Seasonal Fashion', 'Fashion Photography', 'Fashion Industry'] },
    
    // Education
    { category: 'Education', titles: ['Learning Strategies', 'Online Education', 'Teaching Methods', 'Educational Technology', 'Student Motivation', 'Curriculum Design', 'Assessment Techniques', 'Special Education', 'Early Childhood Education', 'Higher Education'] },
    { category: 'Languages', titles: ['Language Learning Tips', 'Language Immersion', 'Grammar Fundamentals', 'Vocabulary Building', 'Pronunciation Guide', 'Language Exchange', 'Multilingual Benefits', 'Language Teaching', 'Translation Techniques', 'Language Technology'] },
    
    // Arts & Culture
    { category: 'Art', titles: ['Painting Techniques', 'Digital Art', 'Art History', 'Sculpture Basics', 'Photography Composition', 'Art Criticism', 'Art Therapy', 'Contemporary Art', 'Art Galleries', 'Art Collecting'] },
    { category: 'Music', titles: ['Music Theory Basics', 'Instrument Learning', 'Music Production', 'Songwriting Tips', 'Music History', 'Music Technology', 'Live Performance', 'Music Business', 'Music Therapy', 'Genre Exploration'] },
    { category: 'Literature', titles: ['Writing Techniques', 'Poetry Analysis', 'Literary Criticism', 'Book Reviews', 'Creative Writing', 'Publishing Industry', 'Literary History', 'Reading Strategies', 'Author Interviews', 'Literary Movements'] },
    
    // Sports
    { category: 'Sports', titles: ['Training Methods', 'Sports Nutrition', 'Injury Prevention', 'Mental Training', 'Team Sports', 'Individual Sports', 'Sports Psychology', 'Coaching Techniques', 'Sports Technology', 'Sports History'] },
    
    // Philosophy & Psychology
    { category: 'Philosophy', titles: ['Ethics and Morality', 'Existentialism', 'Stoicism Principles', 'Eastern Philosophy', 'Logic and Reasoning', 'Philosophy of Mind', 'Political Philosophy', 'Aesthetics', 'Metaphysics', 'Philosophy of Science'] },
    { category: 'Psychology', titles: ['Cognitive Psychology', 'Behavioral Psychology', 'Social Psychology', 'Developmental Psychology', 'Clinical Psychology', 'Positive Psychology', 'Neuropsychology', 'Therapy Techniques', 'Mental Health', 'Personality Psychology'] },
    
    // History & Culture
    { category: 'History', titles: ['Ancient Civilizations', 'World War History', 'Medieval Period', 'Renaissance Era', 'Modern History', 'Historical Research', 'Archaeology', 'Historical Figures', 'Cultural History', 'Economic History'] },
    { category: 'Culture', titles: ['Cultural Anthropology', 'Cultural Traditions', 'Cultural Exchange', 'Cultural Identity', 'Cultural Heritage', 'Cultural Studies', 'Global Culture', 'Indigenous Cultures', 'Cultural Preservation', 'Cultural Diversity'] },
    
    // Environment & Sustainability
    { category: 'Environment', titles: ['Climate Change', 'Renewable Energy', 'Sustainability Practices', 'Environmental Conservation', 'Green Technology', 'Eco-Friendly Living', 'Biodiversity', 'Environmental Policy', 'Carbon Footprint', 'Sustainable Development'] },
    
    // Miscellaneous
    { category: 'DIY', titles: ['Home Improvement', 'Craft Projects', 'Woodworking Basics', 'Gardening Tips', 'Home Repairs', 'DIY Electronics', 'Upcycling Ideas', 'Handmade Crafts', 'DIY Decor', 'Tool Guide'] },
    { category: 'Productivity', titles: ['Time Management', 'Productivity Systems', 'Goal Setting', 'Habit Formation', 'Focus Techniques', 'Work-Life Balance', 'Task Management', 'Productivity Tools', 'Mindfulness Practices', 'Efficiency Tips'] },
  ];
  
  // Content templates for different categories
  const contentTemplates = {
    'AI': (title) => `Artificial intelligence and ${title.toLowerCase()} represent cutting-edge technology transforming industries. These systems leverage advanced algorithms to process information, learn from data, and make intelligent decisions. Applications span from healthcare diagnostics to autonomous systems, revolutionizing how we interact with technology.`,
    'Web Dev': (title) => `Modern web development with ${title.toLowerCase()} focuses on creating responsive, scalable applications. Developers use frameworks and tools to build user-friendly interfaces and robust backend systems. Best practices include code optimization, security measures, and performance tuning for optimal user experience.`,
    'Mobile': (title) => `Mobile development covering ${title.toLowerCase()} involves creating applications for smartphones and tablets. Developers focus on user experience, performance optimization, and platform-specific features. The mobile ecosystem continues to evolve with new technologies and design patterns.`,
    'Cloud': (title) => `Cloud computing and ${title.toLowerCase()} provide scalable infrastructure for modern applications. Organizations leverage cloud services for storage, computing power, and managed services. Benefits include cost efficiency, scalability, and global accessibility.`,
    'Physics': (title) => `Physics research on ${title.toLowerCase()} explores fundamental principles governing the universe. Scientists investigate matter, energy, and their interactions through theoretical models and experimental observations. These discoveries advance our understanding of natural phenomena.`,
    'Biology': (title) => `Biological sciences studying ${title.toLowerCase()} examine living organisms and their processes. Research covers cellular mechanisms, genetic information, and ecological systems. These studies contribute to medical advances and environmental conservation.`,
    'Chemistry': (title) => `Chemistry focusing on ${title.toLowerCase()} investigates molecular structures and chemical reactions. Scientists study how atoms and molecules interact, leading to new materials, medicines, and technologies. Applications span from pharmaceuticals to materials science.`,
    'Astronomy': (title) => `Astronomy research on ${title.toLowerCase()} explores celestial objects and cosmic phenomena. Astronomers use telescopes and space missions to study planets, stars, galaxies, and the universe's origins. These discoveries expand our cosmic perspective.`,
    'Startups': (title) => `Startup ecosystem around ${title.toLowerCase()} involves innovative companies solving real-world problems. Entrepreneurs develop products, secure funding, and scale businesses. Success requires market validation, strong teams, and execution excellence.`,
    'Marketing': (title) => `Marketing strategies for ${title.toLowerCase()} help businesses reach and engage customers. Digital channels, content creation, and data analytics drive modern marketing campaigns. Effective marketing builds brand awareness and drives growth.`,
    'Finance': (title) => `Financial planning covering ${title.toLowerCase()} helps individuals and businesses manage money effectively. Topics include investments, budgeting, risk management, and wealth building. Sound financial strategies ensure long-term security and growth.`,
    'Management': (title) => `Management practices for ${title.toLowerCase()} focus on leading teams and organizations effectively. Leaders set vision, coordinate resources, and drive results. Good management balances people, processes, and performance.`,
    'Fitness': (title) => `Fitness training involving ${title.toLowerCase()} promotes physical health and strength. Exercise routines, proper nutrition, and recovery are essential components. Regular physical activity improves cardiovascular health and overall well-being.`,
    'Health': (title) => `Health and wellness regarding ${title.toLowerCase()} encompasses physical and mental well-being. Preventive care, healthy habits, and medical knowledge contribute to longevity. Holistic approaches address body, mind, and lifestyle factors.`,
    'Travel': (title) => `Travel experiences related to ${title.toLowerCase()} offer opportunities for adventure and cultural exploration. Travelers discover new places, meet people, and broaden perspectives. Planning, budgeting, and safety ensure enjoyable journeys.`,
    'Food': (title) => `Culinary arts covering ${title.toLowerCase()} explore cooking techniques and food culture. Chefs and home cooks experiment with ingredients, flavors, and presentation. Food brings people together and reflects cultural traditions.`,
    'Fashion': (title) => `Fashion industry around ${title.toLowerCase()} reflects personal expression and cultural trends. Designers create clothing and accessories that combine aesthetics with functionality. Fashion evolves with social movements and technological innovations.`,
    'Education': (title) => `Educational approaches to ${title.toLowerCase()} focus on effective teaching and learning methods. Educators use various strategies to engage students and facilitate understanding. Technology enhances learning experiences and accessibility.`,
    'Languages': (title) => `Language learning for ${title.toLowerCase()} opens doors to communication and cultural understanding. Learners practice speaking, reading, and writing through immersion and structured study. Multilingualism enhances cognitive abilities and career opportunities.`,
    'Art': (title) => `Artistic expression through ${title.toLowerCase()} allows creators to communicate ideas and emotions. Artists use various mediums and techniques to produce visual works. Art reflects society, challenges perspectives, and inspires audiences.`,
    'Music': (title) => `Musical exploration of ${title.toLowerCase()} involves composition, performance, and appreciation. Musicians create melodies, harmonies, and rhythms that resonate with listeners. Music transcends language and connects people across cultures.`,
    'Literature': (title) => `Literary works covering ${title.toLowerCase()} explore human experiences through written word. Authors craft stories, poems, and essays that entertain and enlighten. Literature preserves culture and stimulates imagination.`,
    'Sports': (title) => `Athletic activities involving ${title.toLowerCase()} promote physical fitness and competition. Athletes train to improve skills, strength, and endurance. Sports teach teamwork, discipline, and perseverance while providing entertainment.`,
    'Philosophy': (title) => `Philosophical inquiry into ${title.toLowerCase()} examines fundamental questions about existence, knowledge, and values. Philosophers analyze concepts, arguments, and ethical dilemmas. Philosophy encourages critical thinking and reflection.`,
    'Psychology': (title) => `Psychological research on ${title.toLowerCase()} studies human behavior and mental processes. Psychologists investigate cognition, emotion, and social interactions. Understanding psychology improves relationships and personal development.`,
    'History': (title) => `Historical analysis of ${title.toLowerCase()} examines past events and their significance. Historians research documents, artifacts, and oral traditions to understand human experience. History provides context for present circumstances.`,
    'Culture': (title) => `Cultural studies of ${title.toLowerCase()} explore shared beliefs, practices, and traditions. Cultures shape identity, communication, and social structures. Understanding cultural diversity promotes tolerance and global cooperation.`,
    'Environment': (title) => `Environmental issues regarding ${title.toLowerCase()} address sustainability and conservation. Scientists and activists work to protect ecosystems and reduce human impact. Environmental awareness drives policy changes and individual actions.`,
    'DIY': (title) => `Do-it-yourself projects for ${title.toLowerCase()} empower individuals to create and repair. DIY enthusiasts learn skills, save money, and gain satisfaction from hands-on work. Projects range from simple crafts to complex constructions.`,
    'Productivity': (title) => `Productivity strategies for ${title.toLowerCase()} help individuals accomplish more with less effort. Techniques include time management, organization, and focus methods. Improved productivity leads to better work-life balance and achievement.`,
  };
  
  // Generate all possible blog combinations
  const allPossibleBlogs = [];
  
  topics.forEach(topic => {
    topic.titles.forEach(titleTemplate => {
      // Create title variations
      const variations = [
        titleTemplate,
        `Advanced ${titleTemplate}`,
        `Complete Guide to ${titleTemplate}`,
        `${titleTemplate}: A Comprehensive Overview`,
        `Understanding ${titleTemplate}`,
        `Mastering ${titleTemplate}`,
        `${titleTemplate} Explained`,
        `The Art of ${titleTemplate}`,
        `${titleTemplate} Fundamentals`,
        `Exploring ${titleTemplate}`,
        `Introduction to ${titleTemplate}`,
        `${titleTemplate} Best Practices`,
        `Getting Started with ${titleTemplate}`,
        `${titleTemplate} Strategies`,
        `Professional ${titleTemplate}`,
      ];
      
      variations.forEach(title => {
        // Generate content
        const baseContent = contentTemplates[topic.category]?.(title) || 
          `${title} is an important topic worth exploring. This subject covers various aspects and applications that are relevant in today's world. Understanding these concepts provides valuable insights and practical knowledge.`;
        
        // Add more detailed content with variations
        const additionalContent = [
          `The field continues to evolve with new research and innovations.`,
          `Practitioners and researchers contribute to advancing knowledge in this area.`,
          `Real-world applications demonstrate the practical value of these concepts.`,
          `Best practices and methodologies help achieve better results.`,
          `Challenges and opportunities shape the future development of this domain.`,
          `Collaboration and knowledge sharing accelerate progress.`,
          `Technology and tools enhance capabilities and efficiency.`,
          `Education and training develop necessary skills and expertise.`,
          `Industry experts share insights and practical experiences.`,
          `Continuous learning and adaptation are essential for success.`,
          `Innovation drives transformation and creates new possibilities.`,
          `Community support and resources facilitate growth and development.`,
        ];
        
        // Create multiple content variations for same title
        for (let i = 0; i < 3; i++) {
          const extraParagraphs = additionalContent
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.floor(Math.random() * 4) + 2)
            .join(' ');
          
          const uniqueTitle = i > 0 ? `${title} (Part ${i + 1})` : title;
          const fullContent = `${baseContent} ${extraParagraphs}`;
          
          allPossibleBlogs.push({
            title: uniqueTitle,
            content: fullContent,
            category: topic.category,
          });
        }
      });
    });
  });
  
  // Shuffle and select count blogs
  const shuffled = allPossibleBlogs.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// Generate 1000 blog posts
const sampleBlogs = generateBlogPosts(1000);

async function createDatabaseIfNotExists() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'amitwaghmare',
    password: process.env.DB_PASSWORD || 'root',
  };

  const targetDatabase = process.env.DB_NAME || 'blogsEmbedding';

  // First, connect to default database to create the target database
  // Try 'postgres' first, then 'template1' as fallback
  let adminPool;
  let defaultDb = 'postgres';

  try {
    adminPool = new Pool({
      ...dbConfig,
      database: 'postgres',
    });
    await adminPool.query('SELECT 1');
  } catch (error) {
    // If 'postgres' database doesn't exist, try 'template1'
    console.log('⚠️  Could not connect to "postgres" database, trying "template1"...');
    try {
      defaultDb = 'template1';
      adminPool = new Pool({
        ...dbConfig,
        database: 'template1',
      });
      await adminPool.query('SELECT 1');
    } catch (err) {
      throw new Error(
        `Cannot connect to PostgreSQL. Please ensure PostgreSQL is running and credentials are correct. ` +
        `Tried: postgres and template1 databases. Error: ${err.message}`
      );
    }
  }

  try {
    console.log('🔄 Checking if database exists...');

    // Check if database exists
    const dbCheckResult = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDatabase]
    );

    if (dbCheckResult.rows.length === 0) {
      console.log(`📦 Creating database: ${targetDatabase}...`);
      // Create database (cannot use parameterized query for database name)
      // Escape database name to prevent SQL injection
      const escapedDbName = targetDatabase.replace(/"/g, '""');
      await adminPool.query(`CREATE DATABASE "${escapedDbName}"`);
      console.log(`✅ Database '${targetDatabase}' created successfully`);
    } else {
      console.log(`✅ Database '${targetDatabase}' already exists`);
    }

    // Close admin connection
    await adminPool.end();
  } catch (error) {
    console.error('❌ Error creating database:', error);
    throw error;
  }
}

async function createTableIfNotExists() {
  try {
    console.log('🔄 Checking if blogs table exists...');
    
    // Check if pgvector extension is available
    try {
      const extCheckResult = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_available_extensions 
          WHERE name = 'vector'
        ) as available;
      `);

      if (!extCheckResult.rows[0].available) {
        throw new Error(
          'pgvector extension is not installed in PostgreSQL.\n\n' +
          'Please install pgvector first:\n' +
          '  macOS: brew install pgvector\n' +
          '  Ubuntu/Debian: Follow instructions at https://github.com/pgvector/pgvector#installation\n' +
          '  Docker: Use pgvector/pgvector image (e.g., pgvector/pgvector:pg16)\n\n' +
          'Or use Docker:\n' +
          '  docker run -d --name postgres-pgvector -e POSTGRES_PASSWORD=your_password -p 5432:5432 pgvector/pgvector:pg16'
        );
      }

      // Enable pgvector extension
      await pool.query('CREATE EXTENSION IF NOT EXISTS vector');
      console.log('✅ pgvector extension enabled');
    } catch (error) {
      // If it's our custom error, throw it as-is
      if (error.message.includes('pgvector extension is not installed')) {
        throw error;
      }
      // Otherwise, check if it's the "extension not available" error
      if (error.message.includes('extension "vector" is not available')) {
        throw new Error(
          'pgvector extension is not installed in PostgreSQL.\n\n' +
          'Please install pgvector first:\n' +
          '  macOS: brew install pgvector\n' +
          '  Ubuntu/Debian: Follow instructions at https://github.com/pgvector/pgvector#installation\n' +
          '  Docker: Use pgvector/pgvector image (e.g., pgvector/pgvector:pg16)\n\n' +
          'Or use Docker:\n' +
          '  docker run -d --name postgres-pgvector -e POSTGRES_PASSWORD=your_password -p 5432:5432 pgvector/pgvector:pg16'
        );
      }
      // Re-throw other errors
      throw error;
    }
    
    // Create blogs table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blogs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        embedding vector(384),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Blogs table verified/created');

    // Create blog_chunks table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blog_chunks (
        id SERIAL PRIMARY KEY,
        blog_id INTEGER NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
        chunk_text TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        start_index INTEGER,
        end_index INTEGER,
        embedding vector(384),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Blog chunks table verified/created');

    // Create indexes if they don't exist
    // For 1000+ blogs, use lists = 100 (rule of thumb: lists = rows / 10, but cap at reasonable value)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS blogs_embedding_idx ON blogs 
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
    `);
    console.log('✅ Blogs vector index verified/created');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS blogs_title_idx ON blogs (title);
    `);
    console.log('✅ Title index verified/created');

    // Create indexes for blog_chunks
    await pool.query(`
      CREATE INDEX IF NOT EXISTS blog_chunks_embedding_idx ON blog_chunks 
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
    `);
    console.log('✅ Chunks vector index verified/created');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS blog_chunks_blog_id_idx ON blog_chunks (blog_id);
    `);
    console.log('✅ Chunks blog_id index verified/created');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS blog_chunks_chunk_index_idx ON blog_chunks (blog_id, chunk_index);
    `);
    console.log('✅ Chunks chunk_index index verified/created');

    // Create update function
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    console.log('✅ Update function created');

    // Create trigger for blogs (DROP IF EXISTS first to avoid errors if it already exists)
    await pool.query(`
      DROP TRIGGER IF EXISTS update_blogs_updated_at ON blogs;
    `);
    await pool.query(`
      CREATE TRIGGER update_blogs_updated_at 
      BEFORE UPDATE ON blogs
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ Blogs update trigger created');

    // Create trigger for blog_chunks
    await pool.query(`
      DROP TRIGGER IF EXISTS update_blog_chunks_updated_at ON blog_chunks;
    `);
    await pool.query(`
      CREATE TRIGGER update_blog_chunks_updated_at 
      BEFORE UPDATE ON blog_chunks
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ Chunks update trigger created');
  } catch (error) {
    console.error('❌ Error creating table:', error);
    throw error;
  }
}

async function clearAllBlogs() {
  try {
    console.log('🔄 Clearing existing blogs and chunks...');
    
    // Use TRUNCATE which is much faster than DELETE for large tables
    // TRUNCATE removes all rows instantly without scanning each row
    // CASCADE automatically truncates dependent tables (blog_chunks)
    await pool.query('TRUNCATE TABLE blogs CASCADE');
    console.log('✅ All existing blogs and chunks cleared (using TRUNCATE)');
  } catch (error) {
    console.error('❌ Error clearing blogs:', error);
    throw error;
  }
}

/**
 * Bulk insert blogs with chunks in batches
 * @param {Array<{title: string, content: string}>} blogs - Array of blog objects
 * @returns {Promise<number>} Number of successfully inserted blogs
 */
async function bulkInsertBlogs(blogs) {
  if (!blogs || blogs.length === 0) {
    return 0;
  }

  try {
    await pool.query('BEGIN');

    // Step 1: Insert all blogs first
    const blogValues = blogs.map((blog, index) => {
      const normalizedTitle = normalizeText(blog.title);
      const normalizedContent = normalizeText(blog.content);
      return {
        title: normalizedTitle,
        content: normalizedContent,
        originalIndex: index,
      };
    });

    // Build bulk insert query for blogs
    const blogPlaceholders = blogValues.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ');
    const blogParams = blogValues.flatMap(b => [b.title, b.content]);
    
    const blogInsertQuery = `
      INSERT INTO blogs (title, content)
      VALUES ${blogPlaceholders}
      RETURNING id, title, content
    `;

    const blogResult = await pool.query(blogInsertQuery, blogParams);
    const insertedBlogs = blogResult.rows;

    // Step 2: Chunk all blogs and prepare chunk data
    const allChunks = [];
    for (let i = 0; i < insertedBlogs.length; i++) {
      const blog = insertedBlogs[i];
      const originalBlog = blogValues[i];
      const chunks = chunkBlog(originalBlog.title, originalBlog.content, 500, 100);
      
      for (const chunk of chunks) {
        allChunks.push({
          blogId: blog.id,
          chunk: chunk,
        });
      }
    }

    // Step 3: Generate embeddings for all chunks
    console.log(`  🔄 Generating embeddings for ${allChunks.length} chunks...`);
    const chunkEmbeddings = [];
    for (const { blogId, chunk } of allChunks) {
      try {
        const embedding = await generateEmbedding(chunk.text);
        chunkEmbeddings.push({
          blogId,
          chunk,
          embedding,
        });
      } catch (error) {
        console.error(`  ⚠️  Error generating embedding for chunk ${chunk.chunkIndex} of blog ${blogId}:`, error.message);
        // Continue with other chunks
      }
    }

    // Step 4: Bulk insert all chunks
    if (chunkEmbeddings.length > 0) {
      const chunkPlaceholders = chunkEmbeddings.map((_, i) => 
        `($${i * 6 + 1}, $${i * 6 + 2}, $${i * 6 + 3}, $${i * 6 + 4}, $${i * 6 + 5}, $${i * 6 + 6}::vector)`
      ).join(', ');
      
      const chunkParams = chunkEmbeddings.flatMap(({ blogId, chunk, embedding }) => [
        blogId,
        chunk.text,
        chunk.chunkIndex,
        chunk.startIndex,
        chunk.endIndex,
        JSON.stringify(embedding),
      ]);

      const chunkInsertQuery = `
        INSERT INTO blog_chunks (blog_id, chunk_text, chunk_index, start_index, end_index, embedding)
        VALUES ${chunkPlaceholders}
      `;

      await pool.query(chunkInsertQuery, chunkParams);
    }

    await pool.query('COMMIT');

    const totalChunks = chunkEmbeddings.length;
    console.log(`  ✅ Inserted ${insertedBlogs.length} blogs with ${totalChunks} chunks`);
    return insertedBlogs.length;
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('❌ Error in bulk insert:', error);
    throw error;
  }
}

async function seedData() {
  try {
    console.log('🔄 Creating database if not exists...');
    await createDatabaseIfNotExists();

    console.log('🔄 Creating table if not exists...');
    await createTableIfNotExists();

    console.log('🔄 Clearing existing data...');
    await clearAllBlogs();

    console.log('🔄 Initializing embedding model...');
    await initializeEmbeddingModel();

    console.log('🔄 Seeding sample blog data...\n');
    console.log(`📝 Generating ${sampleBlogs.length} blog posts...\n`);

    // Process blogs in bulk batches of 100
    const batchSize = 100;
    let totalInserted = 0;
    let totalFailed = 0;

    for (let i = 0; i < sampleBlogs.length; i += batchSize) {
      const batch = sampleBlogs.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(sampleBlogs.length / batchSize);
      
      console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} blogs)...`);
      
      try {
        const inserted = await bulkInsertBlogs(batch);
        totalInserted += inserted;
        console.log(`✅ Batch ${batchNumber} completed: ${inserted}/${batch.length} blogs inserted`);
      } catch (error) {
        console.error(`❌ Error in batch ${batchNumber}:`, error.message);
        totalFailed += batch.length;
        
        // Try inserting individually as fallback
        console.log(`  🔄 Attempting individual inserts for batch ${batchNumber}...`);
        for (const blog of batch) {
          try {
            await createBlog(blog.title, blog.content);
            totalInserted++;
            totalFailed--;
          } catch (err) {
            console.error(`  ❌ Failed to insert blog "${blog.title}":`, err.message);
          }
        }
      }
    }

    console.log('\n✅ Successfully seeded sample data!');
    console.log(`📊 Total: ${totalInserted} blogs inserted, ${totalFailed} failed`);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedData();

