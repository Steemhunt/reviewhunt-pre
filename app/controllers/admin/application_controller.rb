# All Administrate controllers inherit from this `Admin::ApplicationController`,
# making it the ideal place to put authentication logic or other
# before_actions.
#
# If you want to add pagination or other controller-level concerns,
# you're free to overwrite the RESTful controller actions.
module Admin
  class ApplicationController < Administrate::ApplicationController
    http_basic_authenticate_with name: ENV['ADMIN_ID'], password: ENV['ADMIN_PW']

    private
      def order
        @order ||= Administrate::Order.new(
          params.fetch(resource_name, {}).fetch(:order, :id),
          params.fetch(resource_name, {}).fetch(:direction, :desc),
        )
      end
  end
end
