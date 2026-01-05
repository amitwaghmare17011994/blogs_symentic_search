import { dirname, resolve } from 'node:path'

import { fileURLToPath } from 'node:url'
import { writeFileSync } from 'node:fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Topics and content templates for generating diverse blog posts
const topics = [
  'Black Holes', 'Galaxies', 'Stars', 'Planets', 'Nebulae', 'Quasars', 'Pulsars',
  'Dark Matter', 'Dark Energy', 'Cosmic Rays', 'Supernovae', 'Exoplanets',
  'Asteroids', 'Comets', 'Meteors', 'Solar System', 'Milky Way', 'Andromeda',
  'Hubble Telescope', 'James Webb Telescope', 'Space Missions', 'Mars Exploration',
  'Moon Landing', 'International Space Station', 'Astronauts', 'Space Technology',
  'Gravitational Waves', 'Big Bang Theory', 'Inflation Theory', 'String Theory',
  'Quantum Mechanics', 'Relativity', 'Space-Time', 'Event Horizon', 'Singularity',
  'White Dwarfs', 'Neutron Stars', 'Red Giants', 'Blue Giants', 'Brown Dwarfs',
  'Solar Flares', 'Sunspots', 'Solar Wind', 'Aurora', 'Magnetic Fields',
  'Galaxy Clusters', 'Superclusters', 'Void Regions', 'Cosmic Web', 'Large Scale Structure'
]

const contentTemplates = [
  (topic) => `The study of ${topic} has revolutionized our understanding of the cosmos. Researchers use advanced telescopes and space missions to observe these phenomena, gathering data that helps us understand the universe's fundamental laws and structures.`,
  
  (topic) => `${topic} represent some of the most fascinating objects in the universe. Through careful observation and analysis, astronomers have discovered remarkable properties that challenge our understanding of physics and cosmology.`,
  
  (topic) => `Understanding ${topic} requires sophisticated instruments and theoretical models. Modern astronomy combines ground-based observations with space missions to provide comprehensive insights into these cosmic phenomena.`,
  
  (topic) => `Recent discoveries about ${topic} have opened new frontiers in astrophysics. These findings contribute to our knowledge of stellar evolution, galactic structure, and the universe's origins.`,
  
  (topic) => `The exploration of ${topic} involves international collaboration and cutting-edge technology. Scientists from around the world work together to analyze data and develop theories about these cosmic objects.`,
  
  (topic) => `${topic} play crucial roles in the universe's evolution. Their properties and behaviors influence the formation of stars, galaxies, and large-scale cosmic structures.`,
  
  (topic) => `Observing ${topic} provides valuable insights into extreme physical conditions. These observations help test fundamental theories of physics under conditions impossible to recreate on Earth.`,
  
  (topic) => `The study of ${topic} combines observational astronomy with theoretical physics. This interdisciplinary approach leads to breakthroughs in understanding cosmic phenomena.`,
  
  (topic) => `Future missions and telescopes will provide unprecedented views of ${topic}. These advanced instruments will reveal new details about their structure, composition, and behavior.`,
  
  (topic) => `Research on ${topic} contributes to our understanding of the universe's history. By studying these objects, astronomers can trace the evolution of cosmic structures over billions of years.`
]

// Generate 1000 blog records
function generateBlogs() {
  const blogs = []
  
  for (let i = 0; i < 1000; i++) {
    const topic = topics[Math.floor(Math.random() * topics.length)]
    const template = contentTemplates[Math.floor(Math.random() * contentTemplates.length)]
    
    // Create variations in titles
    const titleVariations = [
      `Exploring ${topic}: A Comprehensive Guide`,
      `Understanding ${topic} in Modern Astronomy`,
      `${topic}: Recent Discoveries and Insights`,
      `The Science Behind ${topic}`,
      `${topic} and Their Role in the Universe`,
      `Advanced Research on ${topic}`,
      `${topic}: From Theory to Observation`,
      `Unveiling the Mysteries of ${topic}`,
      `${topic} and Cosmic Evolution`,
      `New Perspectives on ${topic}`
    ]
    
    const title = titleVariations[Math.floor(Math.random() * titleVariations.length)]
    
    // Generate content with multiple paragraphs
    let content = template(topic) + '\n\n'
    
    // Add more paragraphs for variety
    const additionalParagraphs = Math.floor(Math.random() * 3) + 2
    for (let j = 0; j < additionalParagraphs; j++) {
      const additionalTemplate = contentTemplates[Math.floor(Math.random() * contentTemplates.length)]
      content += additionalTemplate(topic) + '\n\n'
    }
    
    // Add some specific details
    content += `Modern astronomical instruments allow scientists to study ${topic} in unprecedented detail. These observations reveal complex structures and behaviors that were previously unknown. The data collected from various wavelengths of light provides a comprehensive view of these cosmic phenomena.\n\n`
    
    content += `Theoretical models help explain the observed properties of ${topic}. These models incorporate principles from general relativity, quantum mechanics, and particle physics to create accurate representations of cosmic objects. As new data becomes available, these models are refined and improved.\n\n`
    
    content += `International collaboration is essential for studying ${topic}. Large-scale projects require resources and expertise from multiple countries, leading to shared discoveries and a deeper understanding of the universe. These collaborative efforts advance our knowledge of cosmic phenomena.`
    
    blogs.push({
      title,
      content: content.trim()
    })
  }
  
  return blogs
}

// Generate and save the JSON file
const blogs = generateBlogs()
const outputPath = resolve(__dirname, 'blogData.json')

writeFileSync(outputPath, JSON.stringify(blogs, null, 2), 'utf-8')

console.log(`✅ Generated ${blogs.length} blog records`)
console.log(`📁 Saved to: ${outputPath}`)

