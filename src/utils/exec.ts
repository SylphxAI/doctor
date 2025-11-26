import { spawn } from 'node:child_process'

export interface ExecResult {
	stdout: string
	stderr: string
	exitCode: number
}

export async function exec(command: string, args: string[], cwd: string): Promise<ExecResult> {
	return new Promise((resolve) => {
		const proc = spawn(command, args, {
			cwd,
			stdio: ['pipe', 'pipe', 'pipe'],
			shell: true,
		})

		let stdout = ''
		let stderr = ''

		proc.stdout?.on('data', (data) => {
			stdout += data.toString()
		})

		proc.stderr?.on('data', (data) => {
			stderr += data.toString()
		})

		proc.on('close', (code) => {
			resolve({
				stdout: stdout.trim(),
				stderr: stderr.trim(),
				exitCode: code ?? 1,
			})
		})

		proc.on('error', () => {
			resolve({
				stdout: '',
				stderr: 'Failed to execute command',
				exitCode: 1,
			})
		})
	})
}
