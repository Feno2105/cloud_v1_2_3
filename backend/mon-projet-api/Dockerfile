FROM php:8.2-fpm

# Installer les dépendances système pour PostgreSQL
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libzip-dev \
    unzip \
    git \
    curl \
    && docker-php-ext-install pdo pdo_pgsql zip \
    && docker-php-ext-enable pdo_pgsql \
    && rm -rf /var/lib/apt/lists/*

# Installer Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

WORKDIR /var/www/html

# Installer les dépendances PHP
COPY composer.json composer.lock ./
RUN if [ -f composer.json ]; then composer install --no-interaction --prefer-dist --no-dev --optimize-autoloader; fi

COPY . .

RUN chown -R www-data:www-data /var/www/html
