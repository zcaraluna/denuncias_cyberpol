const { spawn } = require('child_process');

const buildProcess = spawn('next', ['build'], {
  shell: true,
  stdio: ['inherit', 'pipe', 'pipe']
});

let stdoutBuffer = '';
let stderrBuffer = '';

// Filtrar mensajes de baseline-browser-mapping de stdout
buildProcess.stdout.on('data', (data) => {
  stdoutBuffer += data.toString();
  const lines = stdoutBuffer.split('\n');
  stdoutBuffer = lines.pop() || ''; // Guardar línea incompleta
  
  lines.forEach(line => {
    if (!line.includes('[baseline-browser-mapping]')) {
      process.stdout.write(line + '\n');
    }
  });
});

// Filtrar mensajes de baseline-browser-mapping de stderr
buildProcess.stderr.on('data', (data) => {
  stderrBuffer += data.toString();
  const lines = stderrBuffer.split('\n');
  stderrBuffer = lines.pop() || ''; // Guardar línea incompleta
  
  lines.forEach(line => {
    if (!line.includes('[baseline-browser-mapping]')) {
      process.stderr.write(line + '\n');
    }
  });
});

buildProcess.on('close', (code) => {
  // Escribir cualquier buffer restante
  if (stdoutBuffer && !stdoutBuffer.includes('[baseline-browser-mapping]')) {
    process.stdout.write(stdoutBuffer);
  }
  if (stderrBuffer && !stderrBuffer.includes('[baseline-browser-mapping]')) {
    process.stderr.write(stderrBuffer);
  }
  process.exit(code);
});

