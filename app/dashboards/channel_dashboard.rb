require "administrate/base_dashboard"

class ChannelDashboard < Administrate::BaseDashboard
  # ATTRIBUTE_TYPES
  # a hash that describes the type of each of the model's fields.
  #
  # Each different type represents an Administrate::Field object,
  # which determines how the attribute is displayed
  # on pages throughout the dashboard.
  ATTRIBUTE_TYPES = {
    hunter: Field::BelongsTo,
    id: Field::Number,
    channel_name: Field::String,
    url: Field::String,
    score: Field::Number,
    created_at: Field::DateTime.with_options(format: '%Y-%m-%dT%H:%M:%S%z'),
    updated_at: Field::DateTime.with_options(format: '%Y-%m-%dT%H:%M:%S%z')
  }.freeze

  # COLLECTION_ATTRIBUTES
  # an array of attributes that will be displayed on the model's index page.
  #
  # By default, it's limited to four items to reduce clutter on index pages.
  # Feel free to add, remove, or rearrange items.
  COLLECTION_ATTRIBUTES = [
    :hunter,
    :id,
    :channel_name,
    :url,
    :score
  ].freeze

  # SHOW_PAGE_ATTRIBUTES
  # an array of attributes that will be displayed on the model's show page.
  SHOW_PAGE_ATTRIBUTES = [
    :hunter,
    :id,
    :channel_name,
    :url,
    :score,
    :created_at,
    :updated_at,
  ].freeze

  # FORM_ATTRIBUTES
  # an array of attributes that will be displayed
  # on the model's form (`new` and `edit`) pages.
  FORM_ATTRIBUTES = [
    :hunter,
    :channel_name,
    :url,
    :score,
  ].freeze

  # Overwrite this method to customize how channels are displayed
  # across all pages of the admin dashboard.
  #
  # def display_resource(channel)
  #   "Channel ##{channel.id}"
  # end
end
