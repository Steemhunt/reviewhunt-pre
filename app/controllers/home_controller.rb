class HomeController < ApplicationController
  def index
    group_count = Channel.group(:channel_name).sum(:score)
    group_count['Blogs'] = group_count.delete('steemit').to_d + group_count.delete('medium').to_d
    group_count['Other Local Channels'] = group_count.delete('others')

    @stats = {
      maker_count: Maker.count,
      total_budget: Maker.sum(:monthly_budget),
      last_makers: Maker.order(id: :desc).first(10),
      channel_count: group_count
    }

    @stats[:max_count] = @stats[:channel_count].values.max.to_d
    @stats[:channel_count] = @stats[:channel_count].sort_by { |_, v| -1 * v }
  end
end
