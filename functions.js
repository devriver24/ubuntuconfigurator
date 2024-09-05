const functions = [
    { name: 'print_separator', code: `print_separator() {
    echo '-----------------------------------------------------------------------------------------------'
}` },
    { name: 'print_header', code: `print_header() {
    print_separator
    echo '---- UPDATING THE SYSTEM FOR VIRTUAL BOX UBUNTU 22.04 SERVER'
    echo '---- script developed by John Phillips 20160904 and updated 20240904'
    echo "---- bash script $0 run on $(date) by $(whoami) in folder $(pwd)"
    print_separator
}` },
    { name: 'update_system', code: `update_system() {
    print_separator
    echo '---- UPDATING THE SERVER'
    apt-get -qq update -y
    apt-get -qq upgrade -y
    print_separator
}` },
    { name: 'set_hostname', code: `set_hostname() {
    print_separator
    echo "---- SETTING HOST NAME TO $hostname"
    hostnamectl set-hostname "$hostname"
    hostnamectl
    print_separator
}` },
    { name: 'create_skel_files', code: `create_skel_files() {
    print_separator
    echo '---- CONFIGURE SKEL FOLDERS FOR ALL USERS'
    mkdir /etc/skel/public_html
    mkdir /etc/skel/public_html/test

    echo '---- ADD TEST FOR HTML'
    echo "<html><body>Hello from HTML</body></html>" >/etc/skel/public_html/test/htmltest.html

    echo '---- ADD TEST SCRIPT FOR PHP'
    echo "<?php phpinfo(); ?>" >/etc/skel/public_html/test/phptest.php

    echo '---- ADD TEST SCRIPT FOR PERL'
    echo "#!/usr/bin/perl" >/etc/skel/public_html/test/perltest.pl
    echo 'print "Content-type: text/html\\n\\n";' >>/etc/skel/public_html/test/perltest.pl
    echo 'print "Hello from Perl\\n";' >>/etc/skel/public_html/test/perltest.pl
    chmod 755 /etc/skel/public_html/test/perltest.pl

    echo '---- ADD TEST SCRIPT FOR PYTHON'
    echo "#!/usr/bin/python3" >/etc/skel/public_html/test/pythontest.py
    echo 'print ("Content-type: text/html\\n\\n")' >>/etc/skel/public_html/test/pythontest.py
    echo 'print ("Hello from Python\\n")' >>/etc/skel/public_html/test/pythontest.py
    chmod 755 /etc/skel/public_html/test/pythontest.py

	echo '---- ADD TEST SCRIPT FOR RUBY'
	echo "#!/usr/bin/ruby" >/etc/skel/public_html/test/rubytest.rb
	echo 'print "Content-type: text/html\\n\\n"' >>/etc/skel/public_html/test/rubytest.rb
	echo 'print "<html><body><p>Hello from Ruby!</p></body></html>"' >>/etc/skel/public_html/test/rubytest.rb
	chmod 755 /etc/skel/public_html/test/rubytest.rb
    print_separator
}` },
    { name: 'create_user', code: `create_user() {
    print_separator
    echo "---- ADDING NEW USER $newusername"
    useradd -m "$newusername" -c "$newusername" -s '/bin/bash'
    echo "---- SETTING PASSWORD FOR $newusername TO $userpw"
    echo "$newusername:$userpw" | sudo chpasswd
    print_separator
}` },
    { name: 'install_utilities', code: `install_utilities() {
    print_separator
    echo '---- INSTALLING A FEW UTILITY PROGRAMS'
    apt-get -qq install -y git bzip2 zip unzip screen net-tools
    print_separator
}` },
    { name: 'install_perl', code: `install_perl() {
    print_separator
    echo '----PERL IS PREINSTALLED / INSTALL MYSQL DRIVER'
    perl --version
    apt-get -qq install -y libdbd-mysql-perl libdbi-perl
    print_separator
}` },
    { name: 'install_python3', code: `install_python3() {
    print_separator
    echo '---- PYTHON AND PYTHON3 ARE PREINSTALLED / INSTALL MYSQL DRIVER'
    python3 --version
    apt-get -qq install -y python3-mysqldb
    print_separator
}` },
    { name: 'install_web_server', code: `install_web_server() {
    print_separator
    echo '---- INSTALL APACHE2 WEB SERVER'
    apt-get -qq install -y apache2

    echo '---- INSTALL PHP8.3 WITH A FEW MODULES'
    apt-get -qq install -y php8.3 php8.3-mysql libapache2-mod-php8.3 php8.3-gd

    echo '---- CONFIGURE APACHE2 TO ALLOW CGI'
    echo "ServerName localhost" >/etc/apache2/conf-available/servername.conf
    a2enconf servername.conf
    sed -i 's/#AddHandler cgi-script .cgi/AddHandler cgi-script .cgi .pl .py .rb/' /etc/apache2/mods-available/mime.conf
    sed -i 's/IncludesNoExec/ExecCGI/' /etc/apache2/mods-available/userdir.conf
    a2enmod cgid
    a2disconf serve-cgi-bin

    echo '---- CONFIGURE APACHE2 TO ALLOW PUBLIC_HTML USER FOLDERS'
    sed -i 's/<IfModule mod_userdir.c>/#<IfModule mod_userdir.c>/' /etc/apache2/mods-available/php8.3.conf
    sed -i 's/    <Directory/#    <Directory/' /etc/apache2/mods-available/php8.3.conf
    sed -i 's/        php_admin_flag engine Off/#        php_admin_flag engine Off/' /etc/apache2/mods-available/php8.3.conf
    sed -i 's/    <\\/Directory>/#    <\\/Directory>/' /etc/apache2/mods-available/php8.3.conf
    sed -i 's/<\\/IfModule>/#<\\/IfModule>/' /etc/apache2/mods-available/php8.3.conf
    a2enmod userdir

    echo '---- SET CORRECT PERMISSIONS FOR USER DIRECTORIES'
    chmod 711 /home/*
    chmod 755 /home/*/public_html
    find /home/*/public_html -type d -exec chmod 755 {} \\;
#    find /home/*/public_html -type f -exec chmod 644 {} \\;

	echo '---- CONFIGURE APACHE2 TO ALLOW .HTACCESS IN USER DIRECTORIES'
    sed -i '/<Directory \\/home\\/\\*\\/public_html\\/>/,/<\\/Directory>/c\\
<Directory /home/*/public_html/>\\
    AllowOverride All\\
    Options Indexes FollowSymLinks\\
    Require all granted\\
</Directory>' /etc/apache2/mods-available/userdir.conf

    echo '---- FIXING APACHE ERROR LOG SO ALL USERS CAN READ IT'
    chmod 644 /var/log/apache2/error.log
    chmod 755 /var/log/apache2
    sed -i 's/create 640 root adm/create 644 root adm/' /etc/logrotate.d/apache2

    systemctl reload apache2
    systemctl restart apache2
    print_separator
}` },
    { name: 'install_database_server', code: `install_database_server() {
    print_separator
    echo '---- INSTALLING MYSQL DATABASE SERVER'
    DEBIAN_FRONTEND=noninteractive apt-get -y install mysql-server
    echo "---- CREATING A TEST DATABASE FOR $newusername"
    mysql -uroot -e "create database $newusername"
    mysql -uroot -e "create user '$newusername'@'localhost' identified by '$userpw'"
    mysql -uroot -e "grant all privileges on $newusername.* to '$newusername'@'localhost' with grant option"
    mysql -uroot -e "flush privileges"
    mysql -u$newusername -p$userpw -e "use $newusername;drop table if exists address;create table address(name varchar(50) not null, street varchar(50) not null, primary key(name));"
    mysql -u$newusername -p$userpw -e "use $newusername;insert into address values('Jane', '123 Main Street');insert into address values('Bob', '222 Oak Street');insert into address values('Sue', '555 Trail Street');"
    print_separator
}` },
    { name: 'install_ruby', code: `install_ruby() {
    print_separator
    echo '---- INSTALLING RUBY WHICH IS PREINSTALLED ON VAGRANT BUT NOT ON VIRTUALBOX OR AWS'
    apt-get -qq install -y ruby
    ruby --version
    # add test script for ruby
    echo "#!/usr/bin/ruby" >/etc/skel/public_html/test/rubytest.rb
    echo 'print "Content-type: text/html\\n\\n"' >>/etc/skel/public_html/test/rubytest.rb
    echo 'print "<html><body><p>Hello using Ruby!</p></body></html>"' >>/etc/skel/public_html/test/rubytest.rb
    chmod 755 /etc/skel/public_html/test/rubytest.rb
    print_separator
}` },
    { name: 'install_java_8', code: `install_java_8() {
    print_separator
    echo '---- INSTALLING JAVA OPEN-JDK-8 COMPILER'
    apt-get -qq install -y openjdk-8-jdk java-common
    # update-alternatives --set java /usr/lib/jvm/java-21-openjdk-amd64/bin/java
    # echo 'JAVA_HOME="/usr/lib/jvm/java-21-openjdk-amd64"' >> /etc/environment
    javac -version
    java -version
    echo '---- INSTALLING JAVA/MYSQL JDBC DRIVER'
    # apt-get -qq install -y libmysql-java
    apt-get -qq install -y libmariadb-java
    # echo 'CLASSPATH=.:/usr/share/java/mysql-connector-java.jar' >> /etc/environment
    echo 'CLASSPATH=.:/usr/share/java/mariadb-java-client.jar' >>/etc/environment
    print_separator
}` },
    { name: 'install_java_21', code: `install_java_21() {
    print_separator
    echo '---- INSTALLING JAVA OPEN-JDK-21 COMPILER'
    apt-get -qq install -y openjdk-21-jdk java-common
    update-alternatives --set java /usr/lib/jvm/java-21-openjdk-amd64/bin/java
    echo 'JAVA_HOME="/usr/lib/jvm/java-21-openjdk-amd64"' >>/etc/environment
    javac -version
    java -version
    # echo '---- INSTALLING JAVA/MYSQL JDBC DRIVER'
    # apt-get -qq install -y libmysql-java
    # apt-get -qq install -y libmariadb-java
    # echo 'CLASSPATH=.:/usr/share/java/mysql-connector-java.jar' >> /etc/environment
    print_separator
}` },
    { name: 'install_c', code: `install_c() {
    print_separator
    echo '---- INSTALLING C AND C++ COMPILERS'
    apt-get -qq install -y build-essential
    gcc --version
    g++ --version
    print_separator
}` },
    { name: 'install_csharp', code: `install_csharp() {
    print_separator
    echo '---- INSTALLING C# COMPILER'
    apt-get -qq install -y mono-complete
    mono
    print_separator
}` },
    { name: 'install_go', code: `install_go() {
    print_separator
    echo '---- INSTALLING GO'
    apt-get -qq install -y golang
    go version
    print_separator
}` },
    { name: 'install_clojure', code: `install_clojure() {
    print_separator
    echo '---- INSTALLING CLOJURE'
    apt-get install -y clojure
    print_separator
}` },
    { name: 'install_fortran', code: `install_fortran() {
    print_separator
    echo '---- INSTALLING FORTRAN COMPILER'
    apt-get install -y gfortran
    gfortran --version
    print_separator
}` },
    { name: 'install_cobol', code: `install_cobol() {
    print_separator
    echo '---- INSTALLING COBOL COMPILER'
    apt-get install -y open-cobol
    cobc -V
    print_separator
}` },
    { name: 'install_pl1', code: `install_pl1() {
    print_separator
    echo '---- INSTALLING PL/I COMPILER'
    wget http://www.iron-spring.com/pli-0.9.9.tgz
    tar -xvzf pli-1.2.0.tgz
    cd pli-1.2.0
    make install
    cd ..
    rm -f pli-1.2.0.tgz
    plic -V
    print_separator
}` },
    { name: 'install_nodejs', code: `install_nodejs() {
    print_separator
    echo '---- INSTALLING NODEJS'
    apt-get install -y nodejs
    node -v
    echo '---- INSTALLING NPM'
    apt-get install -y npm
    print_separator
}` },
	{ name: 'print_footer', code: `print_footer() {
	print_separator
	finishtime=$(date "+%s")
	elapsed_time=$((finishtime - starttime))
	echo "Elapsed time was $elapsed_time seconds."
	echo "The ip address is $(hostname -I)"
	print_separator
}` }
]