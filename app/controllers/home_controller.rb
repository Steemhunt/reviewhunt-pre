class HomeController < ApplicationController
  def index
    locale = params[:locale] ? params[:locale] : cookies[:locale] ? cookies[:locale] : 'en'
    I18n.locale = I18n.available_locales.map(&:to_s).include?(locale) ? locale : 'en'
    cookies[:locale] = I18n.locale

    @stats = {
      maker_count: Maker.count,
      total_budget: Maker.sum(:monthly_budget),
      last_makers: Maker.order(id: :desc).first(10),
      channel_count: Channel.group(:channel_name).sum(:score)
    }

    @stats[:max_count] = @stats[:channel_count].values.max.to_d
    @stats[:channel_count] = @stats[:channel_count].sort_by { |_, v| -1 * v }
  end
end
