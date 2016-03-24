import typescript from 'rollup-plugin-typescript'

export default {
	moduleName: 'tests',
	plugins: [
		typescript()
	],
}