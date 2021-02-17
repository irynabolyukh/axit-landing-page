'use strict';

const { src, dest, watch, series } = require('gulp');

const browserSync = require("browser-sync").create();

const mode = require("gulp-mode")({
  modes: ["production", "development"],
  default: "development",
  verbose: false
});

const del = require("del");
const rename = require("gulp-rename");

const htmlmin = require('gulp-htmlmin');
const imagemin = require('gulp-imagemin');

const sass = require("gulp-sass");
// const less = require("gulp-less");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");

const sourcemaps = require("gulp-sourcemaps");

const dist = {
  prod: "docs",
  dev: "src"
};
const paths = {
  styles: {
    src: "src/scss/*.scss",
    ignore: [],
    dest: {
      prod: `${dist.prod}/css`,
      dev: `${dist.dev}/css`
    }
  },
  html: {
    src: "src/*.html",
    dest: `${dist.prod}`
  },
  images: {
    src: "src/images/*.png",
    ignore: ["!src/meta/*"],
    dest: {
      prod: `${dist.prod}/images`,
      dev: `${dist.dev}/images`
    }
  },
  icons: {
    src: "src/meta/*",
    dest: `${dist.prod}/meta/*`
  }
};

function buildCSS() {
  return (
    src([paths.styles.src, ...paths.styles.ignore])
    .pipe(mode.development(sourcemaps.init()))
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(rename({suffix: '.min'}))
    .pipe(mode.development(sourcemaps.write()))
    .pipe(mode.development(dest(paths.styles.dest.dev)))
    .pipe(mode.production(dest(paths.styles.dest.prod)))
    .pipe(browserSync.reload({
      stream: true
    }))
  );
};

function minHTML() {
  return (
    src(paths.html.src)
    .pipe(htmlmin({ collapseWhitespace: true}))
    .pipe(dest(paths.html.dest))
  );
}; 

function minIMAGES() {
  return (
    src(paths.images.src)
    .pipe(imagemin())
    .pipe(mode.development(dest(paths.images.dest.dev)))
    .pipe(mode.production(dest(paths.images.dest.prod)))
  );
}; 

function copyIcons() {
  return (
    src(paths.icons.src)
    .pipe(dest(paths.icons.dest))
  );
};

function cleanDist() {
  process.env.NODE_ENV = 'production';
	return del([`${dist.prod}/**`, `!${dist.prod}`]);
};

function reload(done) {
  browserSync.reload();
  done();
};

function serve() {
  browserSync.init({
    server: `./${dist.dev}`,
    host: 'localhost',
    port: 8080
  });
  watch(paths.styles.src, buildCSS);
  watch(paths.html.src, reload);
};

exports.buildCSS = buildCSS;

exports.serve = series(buildCSS, minIMAGES, serve);
exports.publish = series(cleanDist, minHTML, copyIcons, buildCSS, minIMAGES);