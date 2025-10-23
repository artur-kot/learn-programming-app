# Maintainer: Artur Kot <artur.kot@outlook.com>
pkgname=learnp-bin
pkgver=0.8.1
pkgrel=1
pkgdesc="Interactive TUI application for learning programming through exercises"
arch=('x86_64')
url="https://github.com/yourusername/learn-programming-app"
license=('MIT')
depends=('gcc-libs')
optdepends=(
    'git: For course update checking'
    'nodejs: For running JavaScript exercises'
    'npm: For exercise dependencies'
    'ollama: For AI-powered hints'
)
provides=('learnp')
conflicts=('learnp')
source=("$pkgname-$pkgver.tar.gz::https://github.com/yourusername/learn-programming-app/releases/download/v$pkgver/learnp-$pkgver-x86_64-unknown-linux-gnu.tar.gz")
sha256sums=('SKIP')  # Update with actual checksum

package() {
    install -Dm755 "$srcdir/learnp" "$pkgdir/usr/bin/learnp"

    # Install documentation if available
    if [ -f "$srcdir/README.md" ]; then
        install -Dm644 "$srcdir/README.md" "$pkgdir/usr/share/doc/$pkgname/README.md"
    fi
}
