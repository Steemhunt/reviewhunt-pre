class HomeController < ApplicationController
  include ApplicationHelper

  def index
    @stats = {
      maker_count: Maker.count,
      total_budget: Maker.sum(:monthly_budget),
      last_makers: Maker.order(id: :desc).first(10),
      channel_count: Channel.group(:channel_name).sum(:score)
    }
  end
end
