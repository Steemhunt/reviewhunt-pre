class HunterMailer < ApplicationMailer
  def pre_sign_up
    @user = params[:user]
    I18n.locale = @user.language
    mail(to: @user.email, subject: I18n.t('email.title'))
  end
end