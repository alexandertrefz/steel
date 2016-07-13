import typescript from 'rollup-plugin-typescript'

export default {
	moduleName: 'steel',
	plugins: [
		typescript({
			typescript: require('typescript'),
			target: 'ES6',
		})
	],
}
