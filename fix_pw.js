const fs = require(" "\fs\');  
const c = fs.readFileSync(\src/pages/LoginPage.jsx\', \utf8\');  
fs.writeFileSync(\src/pages/LoginPage.jsx\', c.replace(new RegExp(\\\\\u2022\', \g\'), \\u2022\'), \utf8\');  
console.log(\done\');  
