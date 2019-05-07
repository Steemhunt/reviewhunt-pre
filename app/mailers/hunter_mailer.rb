class HunterMailer < ApplicationMailer
  def pre_sign_up
    @user = params[:user]
    mail(to: @user.email, subject: 'You have pre signed-up for Reviewhunt')
  end
end