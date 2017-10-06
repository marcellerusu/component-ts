module.exports = {
 entry: './some.ts',
 output: {
   filename: 'bundle.js',
   path: __dirname
 },
 module: {
   rules: [
     {
       test: /\.tsx?$/,
       loader: 'ts-loader'
     },
   ]
 },
 resolve: {
   extensions: [".tsx", ".ts", ".js"]
 },
};