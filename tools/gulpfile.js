const path = require('path'),
	  gulp = require('gulp'),
	  del = require('del'),
	  babel = require('gulp-babel');

var srcPath = path.join(__dirname, '../src/**/*'),
	distPath = path.join(__dirname, '../dist/');

gulp.task('es5', () => {
	return gulp.src(srcPath)
    		   .pipe(babel({
		            presets: [
		            	'es2015',
		            	'es2016',
		            	'es2017'
		            ],
		            plugins: [
		            	'transform-runtime'
		            ]
		        }))
     		   .pipe(gulp.dest(distPath));
});

gulp.task('clean', () => {
	return del([
	    distPath
	], { force: true, });
});

gulp.task('default', ['clean', 'es5'], (cb) => {
	cb();
});

gulp.task('dev', ['clean', 'es5'], () => {
	gulp.watch([srcPath], ['es5']);
});