FROM ubuntu:18.04
LABEL org.opencontainers.image.authors="Andrew Nowak <an8@sanger.ac.uk>"

# Get branch to build from
ARG BUILD_BRANCH=devel
ARG BUILD_REPO=wtsi-npg/npg_ranger

# Hold versions in environment variables.
ENV NODE_VERSION=16.14.0 \
    MONGODB_VERSION=3.6.14 \
    SAMTOOLS_VERSION=1.14.0 \
    LIBHTS_PLUGINS_VERSION=201712 \
    BIOBAMBAM_VERSION=2.0.79 \
    FREEBAYES_VERSION=1.2.0 \
    NPG_RANGER_VERSION=2.0.0 \
    CONDA_GENERIC_CHANNEL='https://dnap.cog.sanger.ac.uk/npg/conda/prod/generic/linux-64/' \
    MINIFORGE_VERSION='24.9.0-0' \
    MINIFORGE_HOME='/miniforge' \
    APT_DEPENDENCIES="wget git xz-utils"

WORKDIR /npg_ranger

# ignore DL3016 since we only install npg_ranger via npm
# hadolint ignore=DL3016
RUN apt-get update -qq \
  && apt-get install --no-install-recommends -qq ca-certificates zlib1g-dev libcurl4-openssl-dev libssl-dev libbz2-dev liblzma-dev s3cmd curl \
  && apt-get update -qq \
  && apt-get install --no-install-recommends -qq $APT_DEPENDENCIES \
  && rm -rf /var/lib/apt/lists/* \
\
# Get Node.js
  && wget -q "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz" \
  && tar xJf "node-v${NODE_VERSION}-linux-x64.tar.xz" -C /usr/local --strip-components=1 \
  && rm "node-v${NODE_VERSION}-linux-x64.tar.xz" \
\
# Get Mongodb - only needed for running grunt tests
# Use a dedicated mongodb container to host db in production
  && wget -q "http://fastdl.mongodb.org/linux/mongodb-linux-x86_64-${MONGODB_VERSION}.tgz" \
  && tar xzf "mongodb-linux-x86_64-${MONGODB_VERSION}.tgz" -C /usr/local --strip-components=1 \
  && rm "mongodb-linux-x86_64-${MONGODB_VERSION}.tgz" \
\
# Install conda
  && mkdir -p /software \
  && wget -q "https://github.com/conda-forge/miniforge/releases/download/${MINIFORGE_VERSION}/Miniforge3-${MINIFORGE_VERSION}-Linux-x86_64.sh" -O "miniforge-${MINIFORGE_VERSION}.sh" \
  && /bin/sh "miniforge-${MINIFORGE_VERSION}.sh" -b -p "${MINIFORGE_HOME}" \
  && export PATH="${MINIFORGE_HOME}/bin:$PATH" \
  && rm "miniforge-${MINIFORGE_VERSION}.sh" \
\
# Install SAMtools from conda channel
  && conda create -p "/software/samtools/${SAMTOOLS_VERSION}" \
  && conda install -p "/software/samtools/${SAMTOOLS_VERSION}" -c "${CONDA_GENERIC_CHANNEL}" samtools="${SAMTOOLS_VERSION}" \
  && conda install -p "/software/samtools/${SAMTOOLS_VERSION}" -c conda-forge -c "${CONDA_GENERIC_CHANNEL}" libhts-plugins="${LIBHTS_PLUGINS_VERSION}" \
\
# Install Biobambam from conda channel
  && conda create -p "/software/biobambam2/${BIOBAMBAM_VERSION}" \
  && conda install -p "/software/biobambam2/${BIOBAMBAM_VERSION}" -c "${CONDA_GENERIC_CHANNEL}" biobambam2="${BIOBAMBAM_VERSION}" \
\
# Install Freebayes from conda channel
  && conda create -p "/software/freebayes/${FREEBAYES_VERSION}" \
  && conda install -p "/software/freebayes/${FREEBAYES_VERSION}" -c "${CONDA_GENERIC_CHANNEL}" freebayes="${FREEBAYES_VERSION}" \
\
# Get Ranger
  && npm install https://github.com/${BUILD_REPO}/tarball/${BUILD_BRANCH}

COPY ./certs/ /usr/share/ca-certificates/ranger/
SHELL ["/bin/bash", "-o", "pipefail", "-c"]
RUN  if [ -d "/usr/share/ca-certificates/ranger" ]; \
  then \
    for i in /usr/share/ca-certificates/ranger/*.pem; \
    do \
      echo "$i"; \
      echo "ranger/$(basename $i)" | tee -a /etc/ca-certificates.conf; \
    done; \
    update-ca-certificates -v; \
  fi


RUN adduser --home /home/apprunner --disabled-password --gecos "" apprunner
COPY ./s3cfg /home/apprunner/.s3cfg
RUN chown -R apprunner:apprunner /npg_ranger /home/apprunner

# Remove build-time dependencies
RUN apt-get remove -qq $APT_DEPENDENCIES \
  && apt-get autoremove --purge -qq \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

ADD https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh /wait-for-it.sh

RUN chmod 0555 /wait-for-it.sh
EXPOSE 5050

USER apprunner
ENV PATH=$PATH:/software/samtools/${SAMTOOLS_VERSION}/bin:/software/biobambam2/${BIOBAMBAM_VERSION}/bin:/software/freebayes/${FREEBAYES_VERSION}/bin:/npg_ranger/node_modules/.bin
CMD [ "/bin/bash" ]
