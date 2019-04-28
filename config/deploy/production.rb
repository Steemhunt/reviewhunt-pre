role :app, '54.191.76.157:2222'
role :web, '54.191.76.157:2222'
role :db, '54.191.76.157:2222', primary: true

set :ssh_options, {
  user: 'updatebot',
  keys: %w(~/.ssh/seb-aws.pem),
  forward_agent: true
}
