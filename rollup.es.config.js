import typescript from 'rollup-plugin-typescript'

export default {
	moduleName: 'steel',
	plugins: [
		typescript({
			target: 'ES6'
		})
	],
}
