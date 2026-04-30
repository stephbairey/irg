<?php
/**
 * Header — sticky bar with logo, primary nav, mobile hamburger.
 * Brand block matches the Astro main site: top "Raging Grannies" /
 * sub-line gaggle locator (italic).
 *
 * @package the-bulletin-local
 */
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="profile" href="https://gmpg.org/xfn/11" />
	<link rel="icon" type="image/svg+xml" href="<?php echo esc_url( TBL_URI . '/assets/images/logo-cropped.svg' ); ?>" />
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<a class="tbl-skip-link" href="#tbl-main">Skip to content</a>

<header class="tbl-header" role="banner">
	<div class="tbl-header-inner">
		<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="tbl-brand" aria-label="<?php echo esc_attr( tbl_gaggle_aka() . ', Home' ); ?>">
			<span class="tbl-brand-mark" aria-hidden="true"><?php echo tbl_logo_svg( 'cropped' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped — local SVG file, content trusted ?></span>
			<span class="tbl-brand-text">
				<span class="tbl-brand-locator"><?php echo esc_html( tbl_gaggle_name() ); ?></span>
				<span class="tbl-brand-network">Raging Grannies</span>
			</span>
		</a>

		<nav class="tbl-nav-desktop" aria-label="Primary">
			<ul>
				<li><a href="<?php echo esc_url( home_url( '/' ) ); ?>"<?php echo is_front_page() ? ' aria-current="page"' : ''; ?>>Home</a></li>
				<li><a href="<?php echo esc_url( home_url( '/about/' ) ); ?>"<?php echo is_page( 'about' ) ? ' aria-current="page"' : ''; ?>>About</a></li>
				<li><a href="<?php echo esc_url( home_url( '/actions/' ) ); ?>"<?php echo ( is_home() || is_singular( 'post' ) || is_archive() ) ? ' aria-current="page"' : ''; ?>>Actions</a></li>
				<li><a href="<?php echo esc_url( home_url( '/photos/' ) ); ?>"<?php echo is_page( 'photos' ) ? ' aria-current="page"' : ''; ?>>Photos</a></li>
				<?php if ( tbl_get_option( 'youtube_channel_url' ) ) : ?>
					<li><a href="<?php echo esc_url( home_url( '/videos/' ) ); ?>"<?php echo is_page( 'videos' ) ? ' aria-current="page"' : ''; ?>>Videos</a></li>
				<?php endif; ?>
				<li><a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>"<?php echo is_page( 'contact' ) ? ' aria-current="page"' : ''; ?>>Contact</a></li>
				<li><a href="<?php echo esc_url( tbl_songs_url() ); ?>" class="tbl-pill" rel="noopener">Songs</a></li>
			</ul>
		</nav>

		<button type="button" class="tbl-nav-toggle" id="tbl-nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="tbl-nav-mobile">
			<svg class="tbl-icon-open"  viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>
			<svg class="tbl-icon-close" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" hidden><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
		</button>
	</div>

	<nav class="tbl-nav-mobile" id="tbl-nav-mobile" aria-label="Mobile" hidden>
		<ul>
			<li><a href="<?php echo esc_url( home_url( '/' ) ); ?>">Home</a></li>
			<li><a href="<?php echo esc_url( home_url( '/about/' ) ); ?>">About</a></li>
			<li><a href="<?php echo esc_url( home_url( '/actions/' ) ); ?>">Actions</a></li>
			<li><a href="<?php echo esc_url( home_url( '/photos/' ) ); ?>">Photos</a></li>
			<?php if ( tbl_get_option( 'youtube_channel_url' ) ) : ?>
				<li><a href="<?php echo esc_url( home_url( '/videos/' ) ); ?>">Videos</a></li>
			<?php endif; ?>
			<li><a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>">Contact</a></li>
			<li><a href="<?php echo esc_url( tbl_songs_url() ); ?>" class="tbl-pill tbl-pill-mobile" rel="noopener">Songs</a></li>
		</ul>
	</nav>
</header>

<main id="tbl-main" class="tbl-main">
