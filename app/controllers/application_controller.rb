class ApplicationController < ActionController::Base
  before_action :set_locale

  private
    def set_locale
      I18n.locale = I18n.available_locales.map(&:to_s).include?(params[:locale]) ? params[:locale] : 'en'
    end
end
