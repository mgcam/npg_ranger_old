#!/bin/bash

set -e -x

pushd /tmp
# mongo
wget -q "http://fastdl.mongodb.org/linux/mongodb-linux-x86_64-${MONGODB_VERSION}.tgz"
tar xfz "mongodb-linux-x86_64-${MONGODB_VERSION}.tgz"

# conda
mkdir -p "${SOFTWARE_HOME}"
wget -q "https://github.com/conda-forge/miniforge/releases/download/${MINIFORGE_VERSION}/Miniforge3-${MINIFORGE_VERSION}-Linux-x86_64.sh" -O "miniforge-${MINIFORGE_VERSION}.sh"
/bin/sh "miniforge-${MINIFORGE_VERSION}.sh" -b -p "${MINIFORGE_HOME}"
export PATH="${MINIFORGE_HOME}/bin:$PATH"
conda config --set auto_update_conda False
conda config --set always_yes True
conda config --set show_channel_urls True

# samtools w/ conda
if [ ! "$(ls -A ${SOFTWARE_HOME}/samtools)" ]; then
conda create -p "${SOFTWARE_HOME}/samtools/${SAMTOOLS1_VERSION}"
conda install -p "${SOFTWARE_HOME}/samtools/${SAMTOOLS1_VERSION}" -c "${CONDA_GENERIC_DEVEL_CHANNEL}" samtools="${SAMTOOLS1_VERSION}"
fi

# biobambam w/ conda
if [ ! "$(ls -A ${SOFTWARE_HOME}/biobambam2)" ]; then
conda create -p "${SOFTWARE_HOME}/biobambam2/${BIOBAMBAM_VERSION}"
conda install -p "${SOFTWARE_HOME}/biobambam2/${BIOBAMBAM_VERSION}" -c "${CONDA_GENERIC_CHANNEL}" biobambam2="${BIOBAMBAM_VERSION}"
fi

# freebayes w/ conda
if [ ! "$(ls -A ${SOFTWARE_HOME}/freebayes)" ]; then
conda create -p "${SOFTWARE_HOME}/freebayes/${FREEBAYES_VERSION}"
conda install -p "${SOFTWARE_HOME}/freebayes/${FREEBAYES_VERSION}" -c "${CONDA_GENERIC_CHANNEL}" freebayes="${FREEBAYES_VERSION}"
fi

# symlink to path
mkdir -p /tmp/usr/bin

ln -s "/tmp/mongodb-linux-x86_64-${MONGODB_VERSION}/bin/mongo" /tmp/usr/bin/mongo
ln -s "/tmp/mongodb-linux-x86_64-${MONGODB_VERSION}/bin/mongod" /tmp/usr/bin/mongod
ln -s "/tmp/mongodb-linux-x86_64-${MONGODB_VERSION}/bin/mongoimport" /tmp/usr/bin/mongoimport
ln -s "/tmp/miniforge/bin/conda" /tmp/usr/bin/conda
ln -s "${SOFTWARE_HOME}"/samtools/"${SAMTOOLS1_VERSION}"/bin/samtools /tmp/usr/bin/samtools
ln -s "${SOFTWARE_HOME}"/biobambam2/"${BIOBAMBAM_VERSION}"/bin/bamstreamingmarkduplicates /tmp/usr/bin/bamstreamingmarkduplicates
ln -s "${SOFTWARE_HOME}"/biobambam2/"${BIOBAMBAM_VERSION}"/bin/bamseqchksum /tmp/usr/bin/bamseqchksum
ln -s "${SOFTWARE_HOME}"/freebayes/"${FREEBAYES_VERSION}"/bin/freebayes /tmp/usr/bin/freebayes

popd
