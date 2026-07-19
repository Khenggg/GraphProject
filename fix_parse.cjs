const fs = require('fs');

const filePaths = [
    'd:\\ky5\\SWP391\\git-graph\\GraphProject\\src\\seed\\parkingBuildingSeed.ts',
    'd:\\ky5\\SWP391\\git-graph\\GraphProject\\ai-context\\sample-data.ts'
];

for (const fp of filePaths) {
  if (fs.existsSync(fp)) {
    let content = fs.readFileSync(fp, 'utf-8');
    // We are looking for the literal string `}\n          { id: "leaf-diag-clear-res"`
    // and replacing it with `},\n          { id: "leaf-diag-clear-res"`
    let result = content.replace(
      '}\\n          { id: "leaf-diag-clear-res"',
      '},\\n          { id: "leaf-diag-clear-res"'
    );
    // actually it should be replaced with a real newline:
    result = result.replace(
      '},\\n          { id: "leaf-diag-clear-res"',
      '},\n          { id: "leaf-diag-clear-res"'
    );
    fs.writeFileSync(fp, result, 'utf-8');
    console.log('Fixed ' + fp);
  }
}
