Rails.application.routes.draw do
  root 'home#index'

  resources :makers, only: [:new, :create]
  resources :hunters, only: [:new, :create]

  namespace :admin do
    resources :channels
    resources :hunters
    resources :makers

    root to: "hunters#index"
  end

  get '/:locale', to: 'home#index'
end
