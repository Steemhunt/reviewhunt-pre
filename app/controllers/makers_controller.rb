class MakersController < ApplicationController
  def new
    @maker = Maker.new
  end

  def create
    @maker = Maker.new(maker_params)
    @maker.language = @maker.detect_language || I18n.locale.to_s

    if @maker.save
      redirect_to '/', notice: 'Thank you. We’ll contact you soon.'
    else
      render action: 'new'
    end
  end

  private
    def maker_params
      params.require(:maker).permit(:email, :company_name, :name, :position, :business_category, :monthly_budget)
    end
end
