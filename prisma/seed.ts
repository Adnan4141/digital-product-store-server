import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

const prisma = new PrismaClient().$extends(withAccelerate())

const productData = [
  {
    name: 'Complete TypeScript Masterclass',
    description: 'Learn TypeScript from basics to advanced patterns. Includes 50+ exercises and real-world projects.',
    price: 49.99,
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
    stock: 100,
    categorySlug: 'courses', // Will be mapped to category ID
  },
  {
    name: 'React & Next.js Complete Guide',
    description: 'Master React and Next.js with server-side rendering, API routes, and deployment strategies.',
    price: 59.99,
    imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
    stock: 75,
    categorySlug: 'courses',
  },
  {
    name: 'Node.js Backend Development',
    description: 'Build scalable backend applications with Node.js, Express, and modern JavaScript practices.',
    price: 44.99,
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
    stock: 50,
    categorySlug: 'courses',
  },
  {
    name: 'Full-Stack Web Development eBook',
    description: 'Comprehensive guide covering HTML, CSS, JavaScript, and modern frameworks.',
    price: 29.99,
    imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
    stock: 200,
    categorySlug: 'ebooks',
  },
  {
    name: 'Database Design & Optimization',
    description: 'Learn database design principles, SQL optimization, and NoSQL database management.',
    price: 39.99,
    imageUrl: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800',
    stock: 80,
    categorySlug: 'ebooks',
  },
  {
    name: 'DevOps & CI/CD Pipeline Course',
    description: 'Master Docker, Kubernetes, GitHub Actions, and deployment automation.',
    price: 69.99,
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
    stock: 60,
    categorySlug: 'courses',
  },
]

async function main() {
  console.log(`\n🚀 Starting database seeding...\n`)

  // ============================================
  // RESET DATABASE (Delete data respecting FK order)
  // ============================================
  console.log('🧹 Cleaning existing data...')
  await prisma.$transaction([
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
  ])
  console.log('   ✓ Existing data cleared\n')
  
  // ============================================
  // STEP 1: Create Categories (Independent)
  // ============================================
  console.log('📁 STEP 1: Creating Categories...')
  console.log('   Categories are independent and can be created first.\n')
  
  const categories = [
    { name: 'Courses', slug: 'courses' },
    { name: 'Templates', slug: 'templates' },
    { name: 'Software', slug: 'software' },
    { name: 'eBooks', slug: 'ebooks' },
  ]
  
  const createdCategories: Array<{
    id: string
    name: string
    slug: string
    createdAt: Date
    updatedAt: Date
  }> = []
  
  for (const category of categories) {
    const createdCategory = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: {
        name: category.name,
        slug: category.slug,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    createdCategories.push(createdCategory)
    console.log(`   ✓ Created category: ${createdCategory.name} (ID: ${createdCategory.id})`)
  }
  
  console.log(`\n   ✅ Step 1 Complete: ${createdCategories.length} categories created\n`)
  
  // ============================================
  // STEP 2: Create Products (Depends on Categories)
  // ============================================
  console.log('📦 STEP 2: Creating Products...')
  console.log('   Products reference Categories via categoryId (optional foreign key).\n')
  
  const createdProducts: Array<{
    id: string
    name: string
    price: number
    stock: number
    categoryId: string | null
  }> = []
  
  for (const product of productData) {
    // Find category by slug to get categoryId
    const category = createdCategories.find(c => c.slug === product.categorySlug)
    const categoryId = category?.id || null
    
    if (categoryId && !category) {
      console.warn(`   ⚠️  Warning: Category slug "${product.categorySlug}" not found for product "${product.name}"`)
    }
    
    const createdProduct = await prisma.product.create({
      data: {
        name: product.name,
        description: product.description || null,
        price: product.price,
        imageUrl: product.imageUrl || null,
        stock: product.stock || 0,
        categoryId: categoryId, // Foreign key reference to Category
      },
    })
    createdProducts.push({
      id: createdProduct.id,
      name: product.name,
      price: product.price,
      stock: product.stock || 0,
      categoryId: categoryId,
    })
    const categoryInfo = category ? ` [Category: ${category.name}]` : ' [No Category]'
    console.log(`   ✓ Created product: ${createdProduct.name}${categoryInfo} (ID: ${createdProduct.id})`)
  }
  
  console.log(`\n   ✅ Step 2 Complete: ${createdProducts.length} products created\n`)
  
  // ============================================
  // STEP 3: Create Orders (Independent)
  // ============================================
  console.log('🛒 STEP 3: Creating Orders...')
  console.log('   Orders are independent and can be created before OrderItems.\n')
  
  const createdOrders: Array<{
    id: string
    customerEmail: string
    totalAmount: number
    status: string
  }> = []
  
  // Order 1: Multiple items
  if (createdProducts.length >= 2) {
    const total1 = createdProducts[0].price + createdProducts[1].price
    const order1 = await prisma.order.create({
      data: {
        customerEmail: 'customer1@example.com',
        totalAmount: total1,
        status: 'PENDING',
        // OrderItems will be created in Step 4
      },
      select: {
        id: true,
        customerEmail: true,
        totalAmount: true,
        status: true,
        createdAt: true,
      },
    })
    createdOrders.push({
      id: order1.id,
      customerEmail: order1.customerEmail,
      status: order1.status,
      totalAmount: total1,
    })
    console.log(`   ✓ Created order: ${order1.id} for ${order1.customerEmail} (Status: ${order1.status})`)
  }

  // Order 2: Single item
  if (createdProducts.length >= 3) {
    const total2 = createdProducts[2].price
    const order2 = await prisma.order.create({
      data: {
        customerEmail: 'customer2@example.com',
        totalAmount: total2,
        status: 'PAID',
        // OrderItems will be created in Step 4
      },
      select: {
        id: true,
        customerEmail: true,
        totalAmount: true,
        status: true,
        createdAt: true,
      },
    })
    createdOrders.push({
      id: order2.id,
      customerEmail: order2.customerEmail,
      status: order2.status,
      totalAmount: total2,
    })
    console.log(`   ✓ Created order: ${order2.id} for ${order2.customerEmail} (Status: ${order2.status})`)
  }

  // Order 3: Quantity > 1
  if (createdProducts.length >= 1) {
    const total3 = createdProducts[0].price * 2
    const order3 = await prisma.order.create({
      data: {
        customerEmail: 'customer3@example.com',
        totalAmount: total3,
        status: 'PENDING',
        // OrderItems will be created in Step 4
      },
      select: {
        id: true,
        customerEmail: true,
        totalAmount: true,
        status: true,
        createdAt: true,
      },
    })
    createdOrders.push({
      id: order3.id,
      customerEmail: order3.customerEmail,
      status: order3.status,
      totalAmount: total3,
    })
    console.log(`   ✓ Created order: ${order3.id} for ${order3.customerEmail} (Status: ${order3.status})`)
  }
  
  console.log(`\n   ✅ Step 3 Complete: ${createdOrders.length} orders created\n`)
  
  // ============================================
  // STEP 4: Create OrderItems (Depends on Orders & Products)
  // ============================================
  console.log('📋 STEP 4: Creating OrderItems...')
  console.log('   OrderItems reference both Orders (orderId) and Products (productId).\n')
  
  let orderItemCount = 0
  
  // OrderItem for Order 1 (multiple items)
  if (createdOrders.length >= 1 && createdProducts.length >= 2) {
    // Item 1 for Order 1
    await prisma.orderItem.create({
      data: {
        orderId: createdOrders[0].id, // Foreign key reference to Order
        productId: createdProducts[0].id, // Foreign key reference to Product
        price: createdProducts[0].price,
        quantity: 1,
      },
    })
    orderItemCount++
    console.log(`   ✓ Created order item: Product "${createdProducts[0].name}" for Order ${createdOrders[0].id}`)
    
    // Item 2 for Order 1
    await prisma.orderItem.create({
      data: {
        orderId: createdOrders[0].id, // Foreign key reference to Order
        productId: createdProducts[1].id, // Foreign key reference to Product
        price: createdProducts[1].price,
        quantity: 1,
      },
    })
    orderItemCount++
    console.log(`   ✓ Created order item: Product "${createdProducts[1].name}" for Order ${createdOrders[0].id}`)
  }

  // OrderItem for Order 2 (single item)
  if (createdOrders.length >= 2 && createdProducts.length >= 3) {
    await prisma.orderItem.create({
      data: {
        orderId: createdOrders[1].id, // Foreign key reference to Order
        productId: createdProducts[2].id, // Foreign key reference to Product
        price: createdProducts[2].price,
        quantity: 1,
      },
    })
    orderItemCount++
    console.log(`   ✓ Created order item: Product "${createdProducts[2].name}" for Order ${createdOrders[1].id}`)
  }

  // OrderItem for Order 3 (quantity > 1)
  if (createdOrders.length >= 3 && createdProducts.length >= 1) {
    await prisma.orderItem.create({
      data: {
        orderId: createdOrders[2].id, // Foreign key reference to Order
        productId: createdProducts[0].id, // Foreign key reference to Product
        price: createdProducts[0].price,
        quantity: 2,
      },
    })
    orderItemCount++
    console.log(`   ✓ Created order item: Product "${createdProducts[0].name}" (x2) for Order ${createdOrders[2].id}`)
  }
  
  console.log(`\n   ✅ Step 4 Complete: ${orderItemCount} order items created\n`)
  
  // ============================================
  // SUMMARY
  // ============================================
  console.log('═══════════════════════════════════════════════════════════')
  console.log('📊 SEEDING SUMMARY')
  console.log('═══════════════════════════════════════════════════════════')
  console.log(`\n📁 Categories: ${createdCategories.length}`)
  createdCategories.forEach(cat => {
    const productCount = createdProducts.filter(p => p.categoryId === cat.id).length
    console.log(`   • ${cat.name} (${cat.slug}): ${productCount} products`)
  })
  
  console.log(`\n📦 Products: ${createdProducts.length}`)
  createdProducts.forEach(prod => {
    const category = createdCategories.find(c => c.id === prod.categoryId)
    const catInfo = category ? ` [${category.name}]` : ' [No Category]'
    console.log(`   • ${prod.name}${catInfo}`)
  })
  
  console.log(`\n🛒 Orders: ${createdOrders.length}`)
  createdOrders.forEach(order => {
    console.log(`   • Order ${order.id}: ${order.customerEmail} (${order.status})`)
  })
  
  console.log(`\n📋 OrderItems: ${orderItemCount}`)
  console.log(`\n✅ Database seeding completed successfully!`)
  console.log('═══════════════════════════════════════════════════════════\n')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
