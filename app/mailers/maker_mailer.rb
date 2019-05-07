class MakerMailer < ApplicationMailer
  def pre_sign_up
    @user = params[:user]
    I18n.locale = @user.language
    mail(to: @user.email, subject: 'You have pre signed-up for Reviewhunt')
  end
end