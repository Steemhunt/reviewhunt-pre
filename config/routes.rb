Rails.application.routes.draw do
  root 'home#index'

  resources :makers, only: [:new, :create]
  resources :hunters, only: [:new, :create]
end
