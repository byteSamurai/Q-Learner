/// <binding BeforeBuild='build, remove-gz-files' />
// ReSharper disable PossiblyUnassignedProperty
var gulp = require("gulp"),
    browserSync = require('browser-sync').create(),
    sourcemaps = require("gulp-sourcemaps"),
    plumber = require("gulp-plumber"),
    typescript = require('typescript'),
    gulpIf = require('gulp-if'),
    sass = require('gulp-sass')(require('node-sass')),
    Builder = require('systemjs-builder'),
    ts = require("gulp-typescript");

var typeScriptFiles = "./app/**/*.ts",
    tsProject = ts.createProject('tsconfig.json'),
    browserFiles = ["./dist/**/*", "./*.html", "./css/**/*"],
    sassFiles = './sass/**/*ss',
    cssFiles = './css',
    appEntry = 'js/main.js',
    appBundleTarget = 'dist/app.bundle.min.js';

var isProductionMode = process.env.NODE_ENV == "production";

/**
 * Erstellt einen Server furch Browser-Sync
 */
gulp.task('connect', function () {
    var serverOptions = {
        reloadOnRestart: true,
        reloadDebounce: 500,
        logLevel: "warning",
        notify: false,
        server: {
            baseDir: ".",
            port: 3000,
            open: "local"
        }
    };
    browserSync.init(serverOptions);
});

/**
 * Übersetzt Sass
 */
gulp.task('sass', function (cb) {
    gulp.src(sassFiles)
        .pipe(sass({
            outputStyle: isProductionMode ? 'compressed' : 'nested'
        }).on('error', sass.logError))
        .pipe(gulp.dest(cssFiles));
    cb();
});


/**
 * Kompiliert Typescript-Dateien
 */
gulp.task("tsc", function () {
    return gulp.src(typeScriptFiles)
        .pipe(plumber())
        .pipe(gulpIf(!isProductionMode, sourcemaps.init()))
        .pipe(tsProject())
        .pipe(gulpIf(!isProductionMode, sourcemaps.write(".")))
        .pipe(gulp.dest("./js/"));
});


/**
 * Bündelt die App-Dateien
 */
gulp.task("bundle-app", function (cb) {
    var builder = new Builder();
    builder.config({
        defaultJSExtensions: true
    });
    builder
        .buildStatic(appEntry, appBundleTarget, {
            // minify: isProductionMode,
            // sourceMaps: !isProductionMode,
            lowResSourceMaps: true,
            mangle: isProductionMode
        })
    // gulp.src(appBundleTarget);
    cb();
});


/**
 * Startet Watcher
 */
gulp.task("watch", function (cb) {
    gulp.series('connect')
    gulp.watch(typeScriptFiles, gulp.series('tsc','bundle-app'));
    gulp.watch(browserFiles).on("change", browserSync.reload);
    gulp.watch(sassFiles, gulp.series('sass'));
    cb();
});


gulp.task("default", gulp.series('tsc', 'sass', 'bundle-app'));