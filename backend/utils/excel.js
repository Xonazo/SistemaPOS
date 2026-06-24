const db = require('../db/db'); // importa el objeto db que ya tienes configurado
const XLSX = require('xlsx');
const path = require('path');

function cleanPrice(priceString) {
  if (!priceString && priceString !== 0) return 0;
  
  // Si ya es un número, devolverlo
  if (typeof priceString === 'number') {
    return Math.round(priceString);
  }
  
  // Convertir a string y limpiar todo: $, espacios, puntos
  const cleanedPrice = String(priceString)
    .trim()
    .replace(/\$/g, '')     // Remover $
    .replace(/\s+/g, '')    // Remover espacios
    .replace(/\./g, '');    // Remover puntos (separadores de miles)
  
  return parseInt(cleanedPrice, 10) || 0;
}

async function importFromExcel(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);

    // Leer Categorias (sin range para incluir headers)
    const categoriesSheet = workbook.Sheets['Categorias'];
    const categories = XLSX.utils.sheet_to_json(categoriesSheet);
    console.log('Categorías leídas:', categories.length);
    console.log('Primera categoría:', categories[0]); // Debug

    // Leer Productos (sin range para incluir headers)
    const productsSheet = workbook.Sheets['Productos'];
    const products = XLSX.utils.sheet_to_json(productsSheet);
    console.log('Productos leídos:', products.length);
    console.log('Primer producto:', products[0]); // Debug

    // Leer Agregados (sin range para incluir headers)
    const addonsSheet = workbook.Sheets['Agregados'];
    const addons = XLSX.utils.sheet_to_json(addonsSheet);
    console.log('Agregados leídos:', addons.length);
    console.log('Primer agregado:', addons[0]); // Debug

    // Preparar statements para insertar
    const insertCategory = db.prepare(`INSERT INTO categories (name, active) VALUES (?, 1)`);
    const getCategoryId = db.prepare(`SELECT id FROM categories WHERE name = ?`);
    const checkCategoryExists = db.prepare(`SELECT COUNT(*) as count FROM categories WHERE name = ?`);

    const insertProduct = db.prepare(`
      INSERT INTO products (name, price, category_id, active)
      VALUES (?, ?, ?, 1)
    `);
    const checkProductExists = db.prepare(`SELECT COUNT(*) as count FROM products WHERE name = ?`);

    const insertAddon = db.prepare(`
      INSERT INTO predefined_agregados (name, price, type, active)
      VALUES (?, ?, 'extra', 1)
    `);
    const checkAddonExists = db.prepare(`SELECT COUNT(*) as count FROM predefined_agregados WHERE name = ?`);

    // Transacción para importar
    const importTransaction = db.transaction(() => {
      let categoriesInserted = 0;
      let productsInserted = 0;
      let addonsInserted = 0;

      console.log('\n=== IMPORTANDO CATEGORÍAS ===');
      // Insertar categorías
      for (const cat of categories) {
        const name = cat.Nombre?.trim();
        if (name) {
          try {
            // Verificar si ya existe
            const existing = checkCategoryExists.get(name);
            if (existing.count === 0) {
              const result = insertCategory.run(name);
              categoriesInserted++;
              console.log(`✓ Categoría insertada: ${name} (ID: ${result.lastInsertRowid})`);
            } else {
              console.log(`- Categoría ya existe: ${name}`);
            }
          } catch (error) {
            console.error(`✗ Error insertando categoría ${name}:`, error.message);
          }
        } else {
          console.log(`- Categoría omitida: nombre vacío`);
        }
      }

      console.log('\n=== IMPORTANDO PRODUCTOS ===');
      // Insertar productos
      for (const prod of products) {
        const name = prod.Nombre?.trim();
        const price = cleanPrice(prod.Precio);
        const categoryName = prod.Categoria?.trim();

        if (name && categoryName) {
          try {
            // Verificar si el producto ya existe
            const productExists = checkProductExists.get(name);
            if (productExists.count === 0) {
              const cat = getCategoryId.get(categoryName);
              if (cat) {
                const result = insertProduct.run(name, price, cat.id);
                productsInserted++;
                console.log(`✓ Producto insertado: ${name} - $${price} (Cat: ${categoryName}, ID: ${result.lastInsertRowid})`);
              } else {
                console.error(`✗ Categoría no encontrada: ${categoryName} para producto ${name}`);
              }
            } else {
              console.log(`- Producto ya existe: ${name}`);
            }
          } catch (error) {
            console.error(`✗ Error insertando producto ${name}:`, error.message);
          }
        } else {
          console.log(`- Producto omitido - datos incompletos: nombre="${name}", categoria="${categoryName}"`);
        }
      }

      console.log('\n=== IMPORTANDO AGREGADOS ===');
      // Insertar agregados
      for (const addon of addons) {
        console.log('Datos del agregado raw:', addon); // Debug completo
        
        const name = addon.Nombre?.trim();
        
        // Intentar diferentes variaciones del nombre de columna para precio
        let priceValue = addon.Precio || addon[' Precio '] || addon['Precio '] || addon[' Precio'] || addon.precio;
        console.log(`Precio encontrado para ${name}:`, priceValue); // Debug
        
        const price = cleanPrice(priceValue);
        
        if (name) {
          try {
            // Verificar si el agregado ya existe
            const addonExists = checkAddonExists.get(name);
            if (addonExists.count === 0) {
              const result = insertAddon.run(name, price);
              addonsInserted++;
              console.log(`✓ Agregado insertado: ${name} - ${price} (ID: ${result.lastInsertRowid})`);
            } else {
              console.log(`- Agregado ya existe: ${name}`);
            }
          } catch (error) {
            console.error(`✗ Error insertando agregado ${name}:`, error.message);
          }
        } else {
          console.log(`- Agregado omitido: nombre vacío`);
        }
      }

      console.log(`\n=== RESUMEN DE IMPORTACIÓN ===`);
      console.log(`✓ Categorías insertadas: ${categoriesInserted}`);
      console.log(`✓ Productos insertados: ${productsInserted}`);
      console.log(`✓ Agregados insertados: ${addonsInserted}`);
    });

    importTransaction();

    console.log('\n🎉 Importación completada exitosamente!');

  } catch (error) {
    console.error('💥 Error durante la importación:', error);
  }
}

// Función para verificar los datos insertados
function verifyData() {
  try {
    const categories = db.prepare('SELECT * FROM categories WHERE active = 1').all();
    const products = db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.active = 1
    `).all();
    const addons = db.prepare('SELECT * FROM predefined_agregados WHERE active = 1').all();

    console.log('\n=== VERIFICACIÓN DE DATOS EN BASE DE DATOS ===');
    console.log(`📁 Categorías activas: ${categories.length}`);
    categories.forEach(cat => console.log(`   - ${cat.name} (ID: ${cat.id})`));

    console.log(`\n📦 Productos activos: ${products.length}`);
    products.forEach(prod => console.log(`   - ${prod.name} - $${prod.price} (${prod.category_name || 'Sin categoría'})`));

    console.log(`\n➕ Agregados activos: ${addons.length}`);
    addons.forEach(addon => console.log(`   - ${addon.name} - $${addon.price}`));

  } catch (error) {
    console.error('Error verificando datos:', error);
  }
}

// Función para limpiar datos duplicados (opcional)
function cleanDuplicates() {
  try {
    console.log('\n=== LIMPIANDO DUPLICADOS ===');
    
    // Limpiar categorías duplicadas
    const categoryDuplicates = db.prepare(`
      DELETE FROM categories 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM categories 
        GROUP BY name
      )
    `).run();
    
    // Limpiar productos duplicados
    const productDuplicates = db.prepare(`
      DELETE FROM products 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM products 
        GROUP BY name
      )
    `).run();
    
    // Limpiar agregados duplicados
    const addonDuplicates = db.prepare(`
      DELETE FROM predefined_agregados 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM predefined_agregados 
        GROUP BY name
      )
    `).run();

    console.log(`Categorías duplicadas eliminadas: ${categoryDuplicates.changes}`);
    console.log(`Productos duplicados eliminados: ${productDuplicates.changes}`);
    console.log(`Agregados duplicados eliminados: ${addonDuplicates.changes}`);
    
  } catch (error) {
    console.error('Error limpiando duplicados:', error);
  }
}

// Ejecutar la importación
const filePath = path.join(__dirname, '../precios.xlsx');

console.log('🚀 Iniciando importación desde:', filePath);
importFromExcel(filePath)
  .then(() => {
    setTimeout(() => {
      verifyData();
      
      // Descomenta la siguiente línea si quieres limpiar duplicados
      // cleanDuplicates();
    }, 1000);
  })
  .catch(error => {
    console.error('Error en el proceso de importación:', error);
  });