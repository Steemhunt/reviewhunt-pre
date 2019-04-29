class ApplicationController < ActionController::Base
  before_action :set_locale

  def set_locale
    locale = params[:locale] || extract_locale_from_accept_language_header
    I18n.locale = I18n.available_locales.map(&:to_s).include?(locale) ? locale : 'en'
  end

  private
    def extract_locale_from_accept_language_header
      request.env['HTTP_ACCEPT_LANGUAGE'].scan(/^[a-z]{2}/).first
    end
end
