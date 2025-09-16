const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Run tests with coverage
console.log('Running test coverage analysis...');
try {
  execSync('npx jest --coverage', { stdio: 'inherit' });
  
  // Parse the coverage summary
  const coveragePath = path.join(__dirname, '..', 'coverage', 'coverage-summary.json');
  const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));
  
  // Generate a simple report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      lines: coverage.total.lines.pct,
      statements: coverage.total.statements.pct,
      functions: coverage.total.functions.pct,
      branches: coverage.total.branches.pct
    },
    lowCoverageFiles: []
  };
  
  // Find files with low coverage
  Object.entries(coverage).forEach(([file, data]) => {
    if (file !== 'total' && data.lines.pct < 80) {
      report.lowCoverageFiles.push({
        file: path.relative(process.cwd(), file),
        lines: data.lines.pct,
        statements: data.statements.pct,
        functions: data.functions.pct,
        branches: data.branches.pct
      });
    }
  });
  
  // Save the report
  const reportPath = path.join(__dirname, '..', 'coverage', 'coverage-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\nCoverage Report (${report.timestamp}):`);
  console.log('----------------------------------------');
  console.log(`Lines: ${report.summary.lines}%`);
  console.log(`Statements: ${report.summary.statements}%`);
  console.log(`Functions: ${report.summary.functions}%`);
  console.log(`Branches: ${report.summary.branches}%`);
  
  if (report.lowCoverageFiles.length > 0) {
    console.log('\nFiles with low coverage (<80%):');
    report.lowCoverageFiles.forEach(file => {
      console.log(`\n${file.file}:`);
      console.log(`  Lines: ${file.lines}%`);
      console.log(`  Functions: ${file.functions}%`);
      console.log(`  Branches: ${file.branches}%`);
    });
  }
  
} catch (error) {
  console.error('Error generating coverage report:', error);
  process.exit(1);
}
