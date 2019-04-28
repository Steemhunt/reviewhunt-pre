Rails.application.routes.draw do
  root 'home#index'
  resources :makers, only: [:new, :create]
  resources :hunters, only: [:new, :create]

  scope "/:locale" do
    root 'home#index'

    resources :makers, only: [:new, :create]
    resources :hunters, only: [:new, :create]
  end

  namespace :admin do
    resources :channels
    resources :hunters
    resources :makers

    root to: "hunters#index"
  end
end
