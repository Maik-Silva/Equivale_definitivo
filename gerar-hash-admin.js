const bcrypt = require("bcryptjs");

// 🔧 ALTERE AQUI: COLOQUE A SENHA QUE DESEJA USAR PARA O ADMIN
const SENHA_ADMIN = "23Novembrode2010."; // ← MUDE PARA A SENHA QUE DESEJA

async function gerarHash() {
  try {
    console.log("🔐 Gerando hash bcrypt com cost factor 10...\n");
    
    const salt = await bcrypt.genSalt(10);
    const senha_hash = await bcrypt.hash(SENHA_ADMIN, salt);
    
    console.log("✅ Hash gerado com sucesso!\n");
    console.log("📋 Use este comando SQL para atualizar o banco:\n");
    console.log(`UPDATE administradores`);
    console.log(`SET senha_hash = '${senha_hash}'`);
    console.log(`WHERE email = 'maiknatanael20@gmail.com';\n`);
    
    console.log("🧪 Testando se o hash funciona com a mesma senha...\n");
    const testaSenha = await bcrypt.compare(SENHA_ADMIN, senha_hash);
    
    if (testaSenha) {
      console.log("✅ TESTE PASSOU! A senha funciona corretamente com este hash.\n");
      console.log("📌 Hash gerado:");
      console.log(senha_hash);
    } else {
      console.log("❌ ERRO! O teste falhou. Tente novamente.");
    }
  } catch (error) {
    console.error("❌ Erro ao gerar hash:", error);
  }
}

gerarHash();
