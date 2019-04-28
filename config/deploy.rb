# config valid for current version and patch releases of Capistrano
lock "~> 3.11.0"

set :application, "review"
set :repo_url, "git@github.com:Steemhunt/reviewhunt-pre.git"

current_branch = `git branch`.match(/\* (\S+)\s/m)[1]
set :branch, ENV['branch'] || current_branch || "master"

set :deploy_to, "/srv/web/#{fetch(:application)}"
set :linked_dirs, %w(log)

# Default value for :linked_files is []
# set :linked_files, fetch(:linked_files, []).push('config/secrets.yml')

# Default value for linked_dirs is []
# set :linked_dirs, fetch(:linked_dirs, []).push('log', 'tmp/pids', 'tmp/cache', 'tmp/sockets', 'vendor/bundle', 'public/system')
set :linked_dirs, fetch(:linked_dirs, []).push('log', 'tmp/pids', 'tmp/cache', 'tmp/sockets', 'vendor/bundle')

# Default value for default_env is {}
# set :default_env, { path: "/opt/ruby/bin:$PATH" }

# Default value for keep_releases is 5
# set :keep_releases, 5

set :rbenv_type, :user # or :system, depends on your rbenv setup
set :rbenv_ruby, '2.6.1'
set :rbenv_prefix, "RBENV_ROOT=#{fetch(:rbenv_path)} RBENV_VERSION=#{fetch(:rbenv_ruby)} #{fetch(:rbenv_path)}/bin/rbenv exec"
# set :rbenv_map_bins, %w{rake gem bundle ruby rails}
set :rbenv_roles, :all # default value

shared_path = "#{fetch(:deploy_to)}/shared"
set :puma_state, "#{shared_path}/pids/puma.state"
set :puma_pid, "#{shared_path}/pids/puma.pid"
set :puma_bind, "unix://#{shared_path}/sockets/puma.sock"
set :puma_conf, "#{shared_path}/puma.rb"
set :puma_access_log, "#{shared_path}/log/puma_error.log"
set :puma_error_log, "#{shared_path}/log/puma_access.log"
set :puma_role, :app
set :puma_env, fetch(:rack_env, fetch(:rails_env, 'production'))

# NOTE: Should sync with puma.rb
set :puma_threads, [4, 30]
set :puma_workers, 2

set :puma_init_active_record, false
set :puma_preload_app, false
set :puma_prune_bundler, true

set :bundle_gemfile, -> { release_path.join('Gemfile') }

namespace :dotenv do
  desc "Upload .env to stage"
  task :upload do
    on roles :web do
      stage = fetch(:rails_env) || fetch(:stage)
      upload! ".env", "#{shared_path}/.env"
      upload! ".env.#{stage}", "#{shared_path}/.env.#{stage}"
    end
  end

  desc "Symlink shared .env to current release"
  task :symlink do
    on roles :web do
      stage = fetch(:rails_env) || fetch(:stage)
      execute :ln, "-nfs #{shared_path}/.env #{release_path}/.env"
      execute :ln, "-nfs #{shared_path}/.env.#{stage} #{release_path}/.env.#{stage}"
    end
  end
end

after 'deploy:symlink:shared', 'dotenv:symlink'
