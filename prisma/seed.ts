import { PrismaClient, AdminRole, AttributeType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create default admin user
    const hashedPassword = await bcrypt.hash(
      process.env['ADMIN_PASSWORD'] || 'admin123!',
      12
    );

    const adminUser = await prisma.adminUser.upsert({
      where: { email: process.env['ADMIN_EMAIL'] || 'admin@drest.sn' },
      update: {},
      create: {
        email: process.env['ADMIN_EMAIL'] || 'admin@drest.sn',
        firstName: process.env['ADMIN_FIRST_NAME'] || 'Admin',
        lastName: process.env['ADMIN_LAST_NAME'] || 'User',
        password: hashedPassword,
        role: AdminRole.SUPER_ADMIN,
        isActive: true,
        permissions: {
          products: { create: true, read: true, update: true, delete: true },
          categories: { create: true, read: true, update: true, delete: true },
          brands: { create: true, read: true, update: true, delete: true },
          inventory: { create: true, read: true, update: true, delete: true },
          reviews: { create: true, read: true, update: true, delete: true },
          users: { create: true, read: true, update: true, delete: true },
          orders: { create: true, read: true, update: true, delete: true },
          analytics: { read: true },
          settings: { update: true }
        }
      }
    });

    console.log('✅ Admin user created:', adminUser.email);

   
    // Create default location - check if it exists first
    let defaultLocation = await prisma.location.findFirst({
      where: { name: 'Main Warehouse' }
    });

    if (!defaultLocation) {
      defaultLocation = await prisma.location.create({
        data: {
          name: 'Main Warehouse',
          address: {
            addressLine1: 'Zone Industrielle',
            city: 'Dakar',
            region: 'Dakar',
            country: 'SN',
            postalCode: '11000'
          },
          isActive: true,
          isDefault: true
        }
      });
    }
    console.log('✅ Default location created:', defaultLocation.name);

    // Create sample brands
    const brands = await Promise.all([
      prisma.brand.upsert({
        where: { slug: 'drest-collection' },
        update: {},
        create: {
          name: 'Drest Collection',
          slug: 'drest-collection',
          description: 'Our signature collection of premium fashion items',
          isActive: true
        }
      }),
      prisma.brand.upsert({
        where: { slug: 'african-elegance' },
        update: {},
        create: {
          name: 'African Elegance',
          slug: 'african-elegance',
          description: 'Traditional African fashion with modern twists',
          isActive: true
        }
      })
    ]);

    console.log('✅ Sample brands created:', brands.map(b => b.name).join(', '));

    // Create category hierarchy
    const fashionCategory = await prisma.category.upsert({
      where: { slug: 'fashion' },
      update: {},
      create: {
        name: 'Mode',
        slug: 'fashion',
        description: 'Vêtements et accessoires de mode',
        seoTitle: 'Mode Sénégalaise - Vêtements Traditionnels et Modernes',
        seoDescription: 'Découvrez notre collection de mode sénégalaise avec des vêtements traditionnels et modernes',
        isActive: true,
        sortOrder: 1
      }
    });

    // Women's fashion subcategory
    const womensCategory = await prisma.category.upsert({
      where: { slug: 'womens-fashion' },
      update: {},
      create: {
        name: 'Mode Femme',
        slug: 'womens-fashion',
        description: 'Vêtements et accessoires pour femmes',
        parentId: fashionCategory.id,
        isActive: true,
        sortOrder: 1
      }
    });

    // Men's fashion subcategory
    const mensCategory = await prisma.category.upsert({
      where: { slug: 'mens-fashion' },
      update: {},
      create: {
        name: 'Mode Homme',
        slug: 'mens-fashion',
        description: 'Vêtements et accessoires pour hommes',
        parentId: fashionCategory.id,
        isActive: true,
        sortOrder: 2
      }
    });

    // Beauty category
    const beautyCategory = await prisma.category.upsert({
      where: { slug: 'beauty' },
      update: {},
      create: {
        name: 'Beauté',
        slug: 'beauty',
        description: 'Produits de beauté et cosmétiques',
        isActive: true,
        sortOrder: 2
      }
    });

    // Home & Living category
    const homeCategory = await prisma.category.upsert({
      where: { slug: 'home-living' },
      update: {},
      create: {
        name: 'Maison & Décoration',
        slug: 'home-living',
        description: 'Décoration et accessoires pour la maison',
        isActive: true,
        sortOrder: 3
      }
    });

    console.log('✅ Category hierarchy created');

    // Create category attributes
    const sizeAttribute = await prisma.categoryAttribute.upsert({
      where: { 
        categoryId_name: {
          categoryId: womensCategory.id,
          name: 'Taille'
        }
      },
      update: {},
      create: {
        categoryId: womensCategory.id,
        name: 'Taille',
        type: AttributeType.SELECT,
        required: true,
        options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        sortOrder: 1
      }
    });

    const colorAttribute = await prisma.categoryAttribute.upsert({
      where: { 
        categoryId_name: {
          categoryId: womensCategory.id,
          name: 'Couleur'
        }
      },
      update: {},
      create: {
        categoryId: womensCategory.id,
        name: 'Couleur',
        type: AttributeType.COLOR,
        required: true,
        sortOrder: 2
      }
    });

    console.log('✅ Category attributes created');

    // Create sample products
    const sampleProduct = await prisma.product.upsert({
      where: { slug: 'robe-traditionnelle-senegalaise' },
      update: {},
      create: {
        name: 'Robe Traditionnelle Sénégalaise',
        slug: 'robe-traditionnelle-senegalaise',
        description: 'Magnifique robe traditionnelle sénégalaise en wax authentique, parfaite pour les occasions spéciales.',
        shortDescription: 'Robe traditionnelle en wax authentique',
        basePrice: 45000, // 45,000 XOF
        comparePrice: 55000,
        images: [
          {
            url: 'https://via.placeholder.com/600x600/FF6B6B/FFFFFF?text=Robe+1',
            alt: 'Robe traditionnelle sénégalaise - vue face',
            isPrimary: true
          },
          {
            url: 'https://via.placeholder.com/600x600/4ECDC4/FFFFFF?text=Robe+2',
            alt: 'Robe traditionnelle sénégalaise - vue dos',
            isPrimary: false
          }
        ],
        seoTitle: 'Robe Traditionnelle Sénégalaise en Wax | Drest.sn',
        seoDescription: 'Découvrez notre collection de robes traditionnelles sénégalaises en wax authentique. Livraison rapide à Dakar.',
        tags: ['robe', 'traditionnel', 'wax', 'sénégal', 'femme'],
        categoryId: womensCategory.id,
        brandId: brands[1].id, // African Elegance
        isActive: true,
        isFeatured: true,
        trackInventory: true,
        publishedAt: new Date()
      }
    });

    // Create product variants
    const productVariants = await Promise.all([
      prisma.productVariant.create({
        data: {
          productId: sampleProduct.id,
          name: 'Taille M / Rouge',
          sku: 'RTS-M-RED-001',
          attributes: {
            taille: 'M',
            couleur: '#FF0000'
          },
          isActive: true
        }
      }),
      prisma.productVariant.create({
        data: {
          productId: sampleProduct.id,
          name: 'Taille L / Bleu',
          sku: 'RTS-L-BLUE-001',
          attributes: {
            taille: 'L',
            couleur: '#0000FF'
          },
          isActive: true
        }
      })
    ]);

    // Create inventory for variants
    await Promise.all(
      productVariants.map(variant =>
        prisma.inventory.create({
          data: {
            variantId: variant.id,
            quantity: 50,
            reserved: 0,
            available: 50,
            locationId: defaultLocation.id
          }
        })
      )
    );

    console.log('✅ Sample product with variants created');

    // Create system settings
    const systemSettings = [
      {
        key: 'site_name',
        value: 'Drest.sn',
        type: 'string',
        description: 'Site name displayed in the frontend'
      },
      {
        key: 'currency',
        value: 'XOF',
        type: 'string',
        description: 'Default currency code'
      },
      {
        key: 'language',
        value: 'fr',
        type: 'string',
        description: 'Default language'
      },
      {
        key: 'timezone',
        value: 'Africa/Dakar',
        type: 'string',
        description: 'Default timezone'
      },
      {
        key: 'pagination_limit',
        value: 20,
        type: 'number',
        description: 'Default pagination limit'
      },
      {
        key: 'low_stock_threshold',
        value: 10,
        type: 'number',
        description: 'Default low stock threshold'
      }
    ];

    await Promise.all(
      systemSettings.map(setting =>
        prisma.systemSetting.upsert({
          where: { key: setting.key },
          update: {},
          create: setting
        })
      )
    );

    console.log('✅ System settings created');

    console.log('🎉 Database seeding completed successfully!');
    console.log(`👤 Admin login: ${adminUser.email}`);
    console.log(`🔑 Admin password: ${process.env['ADMIN_PASSWORD'] || 'admin123!'}`);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });