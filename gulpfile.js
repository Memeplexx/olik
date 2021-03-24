var gulp = require('gulp');
var path = require('path');
var del = require('del');
const rootFolder = path.join(__dirname);

gulp.task('typings:clean', function() {
  console.log('Remove typings from dist folder');
  return del([`dist/*/*.d.ts`])
});

gulp.task('typings:copy', function() {
  console.log('Copy typings from dist folder to root');
  return gulp.src(`dist/esm/*.d.ts`)
      .pipe(gulp.dest('types'));
});

gulp.task('default', gulp.series('typings:copy', 'typings:clean'));
