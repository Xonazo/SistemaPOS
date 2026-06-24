const bcrypt = require('bcrypt');
const db = require('./db/db'); // Ajusta la ruta si es necesario

(async () => {
  const email = 'bruno@gmail.com';
  const password = 'dondelatina1524';
  const SALT_ROUNDS = 10;

  const stmtCheck = db.prepare('SELECT id FROM users WHERE email = ?');
  const existingUser = stmtCheck.get(email);

  if (!existingUser) {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const stmtInsert = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)');
    const info = stmtInsert.run(email, hashedPassword);
    console.log('Usuario creado con ID:', info.lastInsertRowid);
  } else {
    console.log('Usuario ya existe');
  }
  process.exit();
})();
