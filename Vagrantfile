# -*- mode: ruby -*-
# vi: set ft=ruby :

$script = <<SCRIPT
debconf-set-selections <<< 'mysql-server mysql-server/root_password password password'
debconf-set-selections <<< 'mysql-server mysql-server/root_password_again password password'

sudo apt-get update
sudo apt-get install -y mysql-server npm nodejs-legacy
cd /vagrant
npm install --quiet
SCRIPT

# All Vagrant configuration is done below. The "2" in Vagrant.configure
# configures the configuration version (we support older styles for
# backwards compatibility). Please don't change it unless you know what
# you're doing.
Vagrant.configure(2) do |config|

  config.vm.box = "ubuntu/vivid64"
  config.vm.hostname = "aggiq"
  config.vm.network "private_network", ip: "192.168.50.100"
#  config.vm.network "public_network"
  config.vm.synced_folder "./", "/vagrant", :mount_options => ['dmode=755', 'fmode=775']
  config.vm.provision "shell", inline: $script

end
