<?php
/**
 * Plugin Name: SupBot.Ai
 * Description: Plug Into ChatGPT's Power: Effortlessly enhance your website with our AI chatbot plugin. Provide instant, accurate responses to customer inquiries, streamline support, and elevate user engagement with cutting-edge conversational AI.
 * Version: 1.0
 * Author: SupBot.Ai
 * Author URI: https://supbot.ai
 * License: GPL2
 */

define('SUPBOTAI_DEFAULT_WELCOME_MESSAGE', 'Hello and welcome! I\'m here to help answer any questions you have. What can I assist you with today?');
define('SUPBOTAI_DEFAULT_ERROR_MESSAGE', 'Oops! It seems like we\'re experiencing a hiccup with our connection. Please bear with us while we fix the issue. Try refreshing the page or come back shortly. Thank you for your patience!');


add_action( 'wp_enqueue_scripts', 'supbotai_enqueue_scripts' );
function supbotai_enqueue_scripts() {
    wp_enqueue_style( 'supbotai-style', plugins_url( '/assets/css/style.css', __FILE__ ) );
    wp_enqueue_script( 'supbotai-script', plugins_url( '/assets/js/script.js', __FILE__ ), array('jquery'), '1.0', true );

    $project_key = get_option('project_key');
    $error_message = get_option('error_message');
    if(false === $error_message) $error_message = SUPBOTAI_DEFAULT_ERROR_MESSAGE;

    wp_localize_script('supbotai-script', 'supbotai_settings', array(
        'project_key' => $project_key,
        'error_message' => $error_message
    ));
}


add_action( 'wp_footer', 'supbotai_add_chat_btn' );
function supbotai_add_chat_btn() {
    $welcome_message = get_option('welcome_message');
    if (false === $welcome_message) $welcome_message = SUPBOTAI_DEFAULT_WELCOME_MESSAGE;

    $project_key = get_option('project_key');
    if(false === $project_key)
        return;

    echo '<div id="supbotai-toggle-btn" class="closed"><div class="supbotai-icon-wrapper"></div></div>
        <div id="supbotai-chatbody">
            <div id="supbotai-credit">Powered By <a href="https://supbot.ai">SupBot.Ai</a></div>
            <div id="supbotai-message-box"><div id="supbotai-messages-wrapper">
                <div class="supbotai-message supbotai-message-bot">' . $welcome_message . '</div>
            </div></div>
            <textarea id="supbotai-message-input"></textarea>
            <div id="supbotai-message-send-btn"></div>
        </div>';
}


add_action('admin_menu', 'supbotai_menu');
function supbotai_menu() {
    $icon_url = '/assets/images/chat-btn.png';
    $position = '25';
    add_menu_page(
        'SupBot.Ai Settings',   // Page title
        'SupBot.Ai',            // Menu title
        'manage_options',       // Capability
        'supbotai-settings',    // Menu slug
        'supbotai_settings_page', // Function that outputs the page content.
        plugins_url('/supbotai/assets/images/supbotai-icon.svg'),              // Icon URL
        10               // Position
    );
}


function supbotai_settings_page() {
    $welcome_message = get_option('welcome_message');
    if (false === $welcome_message) $welcome_message = SUPBOTAI_DEFAULT_WELCOME_MESSAGE;
    $error_message = get_option('error_message');
    if(false === $error_message) $error_message = SUPBOTAI_DEFAULT_ERROR_MESSAGE;

    ?>
    <div class="wrap">
        <img style="width: 200px; padding-top: 20px" src="<?php echo plugins_url('/supbotai/assets/images/supbotai-logo.png') ?>" />
        
        <form method="post" action="options.php">
            <?php settings_fields('supbotai-settings-group'); ?>
            <?php do_settings_sections('supbotai-settings-group'); ?>
            
            <table class="form-table">

                <tr valign="top">
                    <th scope="row">Project Key</th>
                    <td>
                        <textarea name="project_key" rows="1" cols="40" maxlength="40"><?php echo esc_textarea(get_option('project_key')); ?></textarea>
                        <div style="background: #000; padding: 10px 20px; color: white; margin-top: 10px;">Need a project key? Just visit our website at <a href="https://supbot.ai" target="_blank">supbot.ai <span style="text-decoration: none;" class="dashicons dashicons-external"></span></a>, sign up for a free account, and create a new project—it's free by default! Once your project is set up, you'll receive a unique project key. Enter it here to activate your chatbot. Let's get started!</div>
                    </td>
                </tr>

                <tr valign="top">
                    <th scope="row">Custom Welcome Message</th>
                    <td><textarea name="welcome_message" rows="5" cols="40"><?php echo esc_textarea($welcome_message); ?></textarea></td>
                </tr>

                <tr valign="top">
                    <th scope="row">Custom Error Message</th>
                    <td><textarea name="error_message" rows="5" cols="40"><?php echo esc_textarea($error_message); ?></textarea></td>
                </tr>

            </table>
            
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}


add_action('admin_init', 'supbotai_settings');
function supbotai_settings() {
    register_setting('supbotai-settings-group', 'project_key',      'sanitize_uuid');
    register_setting('supbotai-settings-group', 'welcome_message',  'sanitize_textarea_field');
    register_setting('supbotai-settings-group', 'error_message',    'sanitize_textarea_field');
}


function sanitize_uuid($input) {
    $pattern = '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i';
    if (preg_match($pattern, $input)) {
        return $input;
    } else {
        add_settings_error('project_key', 'invalid-uuid', 'Invalid Project ID format. Please provide a valid UUID.');
        return false;
    }
}
